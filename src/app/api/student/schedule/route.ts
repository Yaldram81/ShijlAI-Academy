import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ==================== TYPES ====================

interface ScheduleEventItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  color: string;
  startDate: string;
  endDate: string | null;
  duration: number;
  allDay: boolean;
  location: string | null;
  meetingUrl: string | null;
  courseId: string | null;
  courseName: string | null;
  courseThumbnail: string | null;
  status: string;
  priority: string;
  source: 'custom' | 'live-session' | 'assignment' | 'quiz' | 'community' | 'study-group';
  isRecurring: boolean;
  tags: string[] | null;
  instructorName: string | null;
}

interface ScheduleStats {
  todayEvents: number;
  weekEvents: number;
  pendingDeadlines: number;
  upcomingLiveSessions: number;
  totalStudyHours: number;
}

interface DeadlineItem {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  courseId: string | null;
  courseName: string | null;
  color: string;
  priority: string;
}

interface Deadlines {
  urgent: DeadlineItem[];
  soon: DeadlineItem[];
  upcoming: DeadlineItem[];
}

interface ScheduleResponse {
  events: ScheduleEventItem[];
  stats: ScheduleStats;
  deadlines: Deadlines;
}

// ==================== HELPERS ====================

function getDateRange(view: string, dateStr: string): { start: Date; end: Date } {
  const date = new Date(dateStr);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);

  switch (view) {
    case 'day':
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
    default:
      // Start from Monday of the week
      const dayOfWeek = start.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start.setDate(start.getDate() + diffToMonday);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

function parseJsonField<T>(field: string | null, fallback: T): T {
  if (!field) return fallback;
  try {
    return JSON.parse(field) as T;
  } catch {
    return fallback;
  }
}

// Color mapping for different event sources
function getColorForSource(source: string, originalColor?: string): string {
  switch (source) {
    case 'live-session': return 'sky';
    case 'assignment': return 'amber';
    case 'quiz': return 'violet';
    case 'community': return 'rose';
    case 'study-group': return 'teal';
    case 'custom': return originalColor || 'emerald';
    default: return originalColor || 'emerald';
  }
}

// ==================== GET: Aggregate all schedule data ====================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const view = searchParams.get('view') || 'week';
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate view param
    if (!['day', 'week', 'month'].includes(view)) {
      return NextResponse.json(
        { error: 'view must be one of: day, week, month' },
        { status: 400 }
      );
    }

    // Validate date param
    const parsedDate = new Date(dateParam);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const { start, end } = getDateRange(view, dateParam);
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Deadline thresholds
    const urgentThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const soonThreshold = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const upcomingThreshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events: ScheduleEventItem[] = [];
    const urgentDeadlines: DeadlineItem[] = [];
    const soonDeadlines: DeadlineItem[] = [];
    const upcomingDeadlines: DeadlineItem[] = [];

    // ---- 1. Custom Events from ScheduleEvent table ----
    const customEvents = await db.scheduleEvent.findMany({
      where: {
        userId,
        startDate: { gte: start, lte: end },
        status: { not: 'cancelled' },
      },
      include: {
        course: {
          select: { id: true, title: true, thumbnail: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    for (const evt of customEvents) {
      events.push({
        id: evt.id,
        title: evt.title,
        description: evt.description,
        type: evt.type,
        color: evt.color,
        startDate: evt.startDate.toISOString(),
        endDate: evt.endDate?.toISOString() || null,
        duration: evt.duration,
        allDay: evt.allDay,
        location: evt.location,
        meetingUrl: evt.meetingUrl,
        courseId: evt.courseId,
        courseName: evt.course?.title || null,
        courseThumbnail: evt.course?.thumbnail || null,
        status: evt.status,
        priority: evt.priority,
        source: 'custom',
        isRecurring: evt.isRecurring,
        tags: parseJsonField<string[]>(evt.tags, null),
        instructorName: null,
      });
    }

    // ---- 2. Live Sessions via SessionAttendee ----
    const sessionAttendees = await db.sessionAttendee.findMany({
      where: {
        userId,
        status: { not: 'cancelled' },
        session: {
          scheduledAt: { gte: start, lte: end },
          status: { not: 'cancelled' },
        },
      },
      include: {
        session: {
          include: {
            course: {
              select: { id: true, title: true, thumbnail: true },
            },
            instructor: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    for (const attendee of sessionAttendees) {
      const session = attendee.session;
      events.push({
        id: `ls-${session.id}`,
        title: session.title,
        description: session.description,
        type: 'live-session',
        color: getColorForSource('live-session'),
        startDate: session.scheduledAt.toISOString(),
        endDate: new Date(session.scheduledAt.getTime() + session.duration * 60 * 1000).toISOString(),
        duration: session.duration,
        allDay: false,
        location: null,
        meetingUrl: session.meetingUrl,
        courseId: session.courseId,
        courseName: session.course?.title || null,
        courseThumbnail: session.course?.thumbnail || null,
        status: session.status,
        priority: 'high',
        source: 'live-session',
        isRecurring: session.isRecurring,
        tags: null,
        instructorName: session.instructor?.name || null,
      });
    }

    // ---- 3. Assignment Deadlines ----
    const enrollments = await db.enrollment.findMany({
      where: { userId, status: { in: ['active', 'completed'] } },
      select: { courseId: true },
    });
    const enrolledCourseIds = enrollments.map(e => e.courseId);

    if (enrolledCourseIds.length > 0) {
      const assignments = await db.assignment.findMany({
        where: {
          courseId: { in: enrolledCourseIds },
          dueDate: { gte: start, lte: end },
          isPublished: true,
        },
        include: {
          course: {
            select: { id: true, title: true, thumbnail: true, instructor: { select: { name: true } } },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      // Check which assignments have been submitted by this user
      const assignmentIds = assignments.map(a => a.id);
      const submissions = await db.submission.findMany({
        where: {
          assignmentId: { in: assignmentIds },
          studentId: userId,
          status: { not: 'returned' },
        },
        select: { assignmentId: true },
      });
      const submittedAssignmentIds = new Set(submissions.map(s => s.assignmentId));

      for (const assignment of assignments) {
        // Skip already submitted assignments
        if (submittedAssignmentIds.has(assignment.id)) continue;

        const dueDate = assignment.dueDate!;
        const deadlineItem: DeadlineItem = {
          id: `assign-${assignment.id}`,
          title: assignment.title,
          type: 'assignment',
          dueDate: dueDate.toISOString(),
          courseId: assignment.courseId,
          courseName: assignment.course?.title || null,
          color: getColorForSource('assignment'),
          priority: 'high',
        };

        // Add to deadlines based on proximity
        if (dueDate <= urgentThreshold) {
          urgentDeadlines.push(deadlineItem);
        } else if (dueDate <= soonThreshold) {
          soonDeadlines.push(deadlineItem);
        } else if (dueDate <= upcomingThreshold) {
          upcomingDeadlines.push(deadlineItem);
        }

        // Add to events as a deadline marker
        events.push({
          id: `assign-${assignment.id}`,
          title: `📝 ${assignment.title}`,
          description: `Assignment due - ${assignment.course?.title || 'Unknown Course'}`,
          type: 'assignment',
          color: getColorForSource('assignment'),
          startDate: dueDate.toISOString(),
          endDate: new Date(dueDate.getTime() + 30 * 60 * 1000).toISOString(),
          duration: 30,
          allDay: false,
          location: null,
          meetingUrl: null,
          courseId: assignment.courseId,
          courseName: assignment.course?.title || null,
          courseThumbnail: assignment.course?.thumbnail || null,
          status: 'scheduled',
          priority: 'high',
          source: 'assignment',
          isRecurring: false,
          tags: ['deadline'],
          instructorName: assignment.course?.instructor?.name || null,
        });
      }
    }

    // ---- 4. Quiz Deadlines ----
    if (enrolledCourseIds.length > 0) {
      const quizzes = await db.quiz.findMany({
        where: {
          courseId: { in: enrolledCourseIds },
          isPublished: true,
        },
        include: {
          course: {
            select: { id: true, title: true, thumbnail: true, instructor: { select: { name: true } } },
          },
        },
      });

      // For quizzes, we don't have an explicit due date, but we can show them as available
      // We check if the student has attempted them already
      for (const quiz of quizzes) {
        // Check if student already attempted and passed
        const attempt = await db.quizAttempt.findFirst({
          where: { userId, quizId: quiz.id, passed: true },
        });
        if (attempt) continue;

        // Use quiz creation date as a reference point for the schedule
        // Since quizzes don't have explicit due dates, we include them as available assessments
        // in the current view period
        const quizCreated = quiz.createdAt;
        const isInViewRange = quizCreated >= start && quizCreated <= end;

        if (isInViewRange) {
          events.push({
            id: `quiz-${quiz.id}`,
            title: `🧪 ${quiz.title}`,
            description: quiz.description || `Quiz - ${quiz.course?.title || 'Unknown Course'}`,
            type: 'quiz',
            color: getColorForSource('quiz'),
            startDate: quizCreated.toISOString(),
            endDate: null,
            duration: quiz.timeLimit || 60,
            allDay: false,
            location: null,
            meetingUrl: null,
            courseId: quiz.courseId,
            courseName: quiz.course?.title || null,
            courseThumbnail: quiz.course?.thumbnail || null,
            status: 'scheduled',
            priority: 'medium',
            source: 'quiz',
            isRecurring: false,
            tags: ['quiz'],
            instructorName: quiz.course?.instructor?.name || null,
          });

          // Add to upcoming deadlines if within threshold
          const deadlineItem: DeadlineItem = {
            id: `quiz-${quiz.id}`,
            title: quiz.title,
            type: 'quiz',
            dueDate: quizCreated.toISOString(),
            courseId: quiz.courseId,
            courseName: quiz.course?.title || null,
            color: getColorForSource('quiz'),
            priority: 'medium',
          };

          if (quizCreated <= upcomingThreshold) {
            upcomingDeadlines.push(deadlineItem);
          }
        }
      }
    }

    // ---- 5. Community Events via EventAttendee ----
    const eventAttendances = await db.eventAttendee.findMany({
      where: {
        userId,
        status: { in: ['registered', 'attended'] },
        event: {
          startDate: { gte: start, lte: end },
          status: { not: 'cancelled' },
          groupId: null, // Not linked to a study group (those go in #6)
        },
      },
      include: {
        event: {
          include: {
            course: {
              select: { id: true, title: true, thumbnail: true, instructor: { select: { name: true } } },
            },
          },
        },
      },
    });

    for (const attendance of eventAttendances) {
      const evt = attendance.event;
      events.push({
        id: `ce-${evt.id}`,
        title: evt.title,
        description: evt.description,
        type: 'community-event',
        color: getColorForSource('community', evt.coverColor),
        startDate: evt.startDate.toISOString(),
        endDate: evt.endDate?.toISOString() || null,
        duration: evt.duration,
        allDay: false,
        location: evt.location,
        meetingUrl: evt.meetingUrl,
        courseId: evt.courseId,
        courseName: evt.course?.title || null,
        courseThumbnail: evt.course?.thumbnail || null,
        status: evt.status,
        priority: 'medium',
        source: 'community',
        isRecurring: false,
        tags: parseJsonField<string[]>(evt.tags, null),
        instructorName: evt.course?.instructor?.name || null,
      });
    }

    // ---- 6. Study Group Events ----
    const studyGroupMemberships = await db.studyGroupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const studyGroupIds = studyGroupMemberships.map(m => m.groupId);

    if (studyGroupIds.length > 0) {
      const studyGroupEvents = await db.communityEvent.findMany({
        where: {
          groupId: { in: studyGroupIds },
          startDate: { gte: start, lte: end },
          status: { not: 'cancelled' },
        },
        include: {
          course: {
            select: { id: true, title: true, thumbnail: true, instructor: { select: { name: true } } },
          },
          group: {
            select: { name: true },
          },
        },
      });

      for (const evt of studyGroupEvents) {
        events.push({
          id: `sg-${evt.id}`,
          title: `${evt.emoji || '📚'} ${evt.title}`,
          description: `${evt.description}${evt.group ? ` | Group: ${evt.group.name}` : ''}`,
          type: 'study-group',
          color: getColorForSource('study-group', evt.coverColor),
          startDate: evt.startDate.toISOString(),
          endDate: evt.endDate?.toISOString() || null,
          duration: evt.duration,
          allDay: false,
          location: evt.location,
          meetingUrl: evt.meetingUrl,
          courseId: evt.courseId,
          courseName: evt.course?.title || null,
          courseThumbnail: evt.course?.thumbnail || null,
          status: evt.status,
          priority: 'medium',
          source: 'study-group',
          isRecurring: false,
          tags: parseJsonField<string[]>(evt.tags, null),
          instructorName: evt.course?.instructor?.name || null,
        });
      }
    }

    // ---- Calculate Stats ----

    // Today's events
    const todayEvents = events.filter(e => {
      const eventStart = new Date(e.startDate);
      return eventStart >= todayStart && eventStart <= todayEnd;
    });

    // Week events
    const weekEvents = events.filter(e => {
      const eventStart = new Date(e.startDate);
      return eventStart >= todayStart && eventStart <= weekEnd;
    });

    // Pending deadlines (within 7 days)
    const allDeadlines = [...urgentDeadlines, ...soonDeadlines, ...upcomingDeadlines];

    // Upcoming live sessions
    const upcomingLiveSessions = events.filter(
      e => e.source === 'live-session' && new Date(e.startDate) > now && e.status === 'scheduled'
    );

    // Total study hours for the view period
    const totalStudyMinutes = events.reduce((sum, e) => sum + e.duration, 0);

    const stats: ScheduleStats = {
      todayEvents: todayEvents.length,
      weekEvents: weekEvents.length,
      pendingDeadlines: allDeadlines.length,
      upcomingLiveSessions: upcomingLiveSessions.length,
      totalStudyHours: Math.round((totalStudyMinutes / 60) * 10) / 10,
    };

    // ---- Build deadlines response ----
    const deadlines: Deadlines = {
      urgent: urgentDeadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      soon: soonDeadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      upcoming: upcomingDeadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    };

    // Sort all events by start date
    events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const response: ScheduleResponse = {
      events,
      stats,
      deadlines,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[SCHEDULE_GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule data' },
      { status: 500 }
    );
  }
}

// ==================== POST: Create a custom schedule event ====================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      title,
      description,
      type,
      color,
      startDate,
      duration,
      allDay,
      location,
      meetingUrl,
      courseId,
      priority,
      tags,
      notes,
      reminders,
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (!startDate) {
      return NextResponse.json({ error: 'startDate is required' }, { status: 400 });
    }

    // Validate user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate startDate is a valid date
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      return NextResponse.json({ error: 'Invalid startDate format' }, { status: 400 });
    }

    // Validate courseId if provided
    if (courseId) {
      const course = await db.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
    }

    // Validate type
    const validTypes = ['class', 'quiz', 'assignment', 'live-session', 'study', 'break', 'exam', 'personal', 'reminder'];
    const eventType = type || 'study';
    if (!validTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate color
    const validColors = ['emerald', 'teal', 'amber', 'rose', 'violet', 'sky', 'orange', 'cyan'];
    const eventColor = color || 'emerald';
    if (!validColors.includes(eventColor)) {
      return NextResponse.json(
        { error: `Invalid color. Must be one of: ${validColors.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const eventPriority = priority || 'medium';
    if (!validPriorities.includes(eventPriority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    const eventDuration = typeof duration === 'number' && duration > 0 ? duration : 60;
    const isAllDay = allDay === true;

    // Calculate endDate if not allDay
    let endDate: Date | null = null;
    if (!isAllDay) {
      endDate = new Date(parsedStartDate.getTime() + eventDuration * 60 * 1000);
    }

    const scheduleEvent = await db.scheduleEvent.create({
      data: {
        userId,
        title: title.trim(),
        description: description || null,
        type: eventType,
        color: eventColor,
        startDate: parsedStartDate,
        endDate,
        duration: eventDuration,
        allDay: isAllDay,
        location: location || null,
        meetingUrl: meetingUrl || null,
        courseId: courseId || null,
        priority: eventPriority,
        tags: tags ? JSON.stringify(tags) : null,
        notes: notes || null,
        reminders: reminders ? JSON.stringify(reminders) : null,
        status: 'scheduled',
      },
      include: {
        course: {
          select: { id: true, title: true, thumbnail: true },
        },
      },
    });

    return NextResponse.json({
      event: {
        id: scheduleEvent.id,
        title: scheduleEvent.title,
        description: scheduleEvent.description,
        type: scheduleEvent.type,
        color: scheduleEvent.color,
        startDate: scheduleEvent.startDate.toISOString(),
        endDate: scheduleEvent.endDate?.toISOString() || null,
        duration: scheduleEvent.duration,
        allDay: scheduleEvent.allDay,
        location: scheduleEvent.location,
        meetingUrl: scheduleEvent.meetingUrl,
        courseId: scheduleEvent.courseId,
        courseName: scheduleEvent.course?.title || null,
        courseThumbnail: scheduleEvent.course?.thumbnail || null,
        status: scheduleEvent.status,
        priority: scheduleEvent.priority,
        source: 'custom' as const,
        isRecurring: scheduleEvent.isRecurring,
        tags: parseJsonField<string[]>(scheduleEvent.tags, null),
        instructorName: null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[SCHEDULE_POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule event' },
      { status: 500 }
    );
  }
}

// ==================== PATCH: Update a schedule event ====================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, userId, ...fields } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Verify event exists
    const existing = await db.scheduleEvent.findUnique({ where: { id: eventId } });
    if (!existing) {
      return NextResponse.json({ error: 'Schedule event not found' }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (fields.title !== undefined) {
      if (typeof fields.title !== 'string' || fields.title.trim().length === 0) {
        return NextResponse.json({ error: 'title must be a non-empty string' }, { status: 400 });
      }
      updateData.title = fields.title.trim();
    }

    if (fields.description !== undefined) {
      updateData.description = fields.description || null;
    }

    if (fields.type !== undefined) {
      const validTypes = ['class', 'quiz', 'assignment', 'live-session', 'study', 'break', 'exam', 'personal', 'reminder'];
      if (!validTypes.includes(fields.type)) {
        return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
      }
      updateData.type = fields.type;
    }

    if (fields.color !== undefined) {
      const validColors = ['emerald', 'teal', 'amber', 'rose', 'violet', 'sky', 'orange', 'cyan'];
      if (!validColors.includes(fields.color)) {
        return NextResponse.json({ error: `Invalid color. Must be one of: ${validColors.join(', ')}` }, { status: 400 });
      }
      updateData.color = fields.color;
    }

    if (fields.startDate !== undefined) {
      const parsedDate = new Date(fields.startDate);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid startDate format' }, { status: 400 });
      }
      updateData.startDate = parsedDate;
    }

    if (fields.duration !== undefined) {
      if (typeof fields.duration !== 'number' || fields.duration <= 0) {
        return NextResponse.json({ error: 'duration must be a positive number' }, { status: 400 });
      }
      updateData.duration = fields.duration;
    }

    if (fields.allDay !== undefined) {
      updateData.allDay = fields.allDay === true;
    }

    if (fields.location !== undefined) {
      updateData.location = fields.location || null;
    }

    if (fields.meetingUrl !== undefined) {
      updateData.meetingUrl = fields.meetingUrl || null;
    }

    if (fields.courseId !== undefined) {
      if (fields.courseId) {
        const course = await db.course.findUnique({ where: { id: fields.courseId } });
        if (!course) {
          return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }
      }
      updateData.courseId = fields.courseId || null;
    }

    if (fields.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(fields.priority)) {
        return NextResponse.json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` }, { status: 400 });
      }
      updateData.priority = fields.priority;
    }

    if (fields.status !== undefined) {
      const validStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled'];
      if (!validStatuses.includes(fields.status)) {
        return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
      }
      updateData.status = fields.status;
    }

    if (fields.tags !== undefined) {
      updateData.tags = fields.tags ? JSON.stringify(fields.tags) : null;
    }

    if (fields.notes !== undefined) {
      updateData.notes = fields.notes || null;
    }

    if (fields.reminders !== undefined) {
      updateData.reminders = fields.reminders ? JSON.stringify(fields.reminders) : null;
    }

    if (fields.isRecurring !== undefined) {
      updateData.isRecurring = fields.isRecurring === true;
    }

    if (fields.recurrencePattern !== undefined) {
      updateData.recurrencePattern = fields.recurrencePattern ? JSON.stringify(fields.recurrencePattern) : null;
    }

    // Recalculate endDate if startDate or duration changed
    if (updateData.startDate || updateData.duration || updateData.allDay !== undefined) {
      const startDate = (updateData.startDate as Date) || existing.startDate;
      const duration = (updateData.duration as number) || existing.duration;
      const isAllDay = updateData.allDay !== undefined ? updateData.allDay as boolean : existing.allDay;

      if (isAllDay) {
        updateData.endDate = null;
      } else {
        updateData.endDate = new Date(startDate.getTime() + duration * 60 * 1000);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await db.scheduleEvent.update({
      where: { id: eventId },
      data: updateData,
      include: {
        course: {
          select: { id: true, title: true, thumbnail: true },
        },
      },
    });

    return NextResponse.json({
      event: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        type: updated.type,
        color: updated.color,
        startDate: updated.startDate.toISOString(),
        endDate: updated.endDate?.toISOString() || null,
        duration: updated.duration,
        allDay: updated.allDay,
        location: updated.location,
        meetingUrl: updated.meetingUrl,
        courseId: updated.courseId,
        courseName: updated.course?.title || null,
        courseThumbnail: updated.course?.thumbnail || null,
        status: updated.status,
        priority: updated.priority,
        source: 'custom' as const,
        isRecurring: updated.isRecurring,
        tags: parseJsonField<string[]>(updated.tags, null),
        instructorName: null,
      },
    });
  } catch (error) {
    console.error('[SCHEDULE_PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule event' },
      { status: 500 }
    );
  }
}

// ==================== DELETE: Delete a custom schedule event ====================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const userId = searchParams.get('userId');

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Verify event exists and belongs to user
    const existing = await db.scheduleEvent.findUnique({ where: { id: eventId } });
    if (!existing) {
      return NextResponse.json({ error: 'Schedule event not found' }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this event' },
        { status: 403 }
      );
    }

    await db.scheduleEvent.delete({ where: { id: eventId } });

    return NextResponse.json({
      message: 'Schedule event deleted successfully',
      eventId,
    });
  } catch (error) {
    console.error('[SCHEDULE_DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule event' },
      { status: 500 }
    );
  }
}
