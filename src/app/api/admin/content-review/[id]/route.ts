import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type ContentType = 'qa_question' | 'qa_answer' | 'discussion_post' | 'discussion_reply' | 'review';
type ModerationAction = 'remove' | 'remove_post' | 'remove_review' | 'keep' | 'keep_post' | 'keep_review' | 'warn_user' | 'suspend_user' | 'ban_user' | 'ban_account' | 'escalate' | 'contact_instructor' | 'investigate_account' | 'add_watchlist';

const VALID_TYPES: ContentType[] = ['qa_question', 'qa_answer', 'discussion_post', 'discussion_reply', 'review'];
const VALID_ACTIONS: ModerationAction[] = ['remove', 'remove_post', 'remove_review', 'keep', 'keep_post', 'keep_review', 'warn_user', 'suspend_user', 'ban_user', 'ban_account', 'escalate', 'contact_instructor', 'investigate_account', 'add_watchlist'];

// Map frontend action names to backend canonical names
const ACTION_ALIASES: Record<string, string> = {
  remove_post: 'remove',
  remove_review: 'remove',
  keep_post: 'keep',
  keep_review: 'keep',
  ban_account: 'ban_user',
  investigate_account: 'escalate',
  add_watchlist: 'keep',
};

const CONTENT_REMOVED_TEXT = '[Content removed by moderator]';

// Get the item and user info based on type
async function getItem(type: ContentType, id: string) {
  switch (type) {
    case 'qa_question': {
      const item = await db.qAQuestion.findUnique({
        where: { id },
        include: { user: { select: { id: true, name: true, email: true, status: true } }, course: { select: { id: true, title: true, instructorId: true } } },
      });
      return item ? { ...item, _userId: item.userId, _courseId: item.courseId, _instructorId: item.course?.instructorId } : null;
    }
    case 'qa_answer': {
      const item = await db.qAAnswer.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true, status: true } },
          question: { select: { id: true, courseId: true, course: { select: { id: true, title: true, instructorId: true } } } },
        },
      });
      return item ? { ...item, _userId: item.userId, _courseId: item.question?.courseId, _instructorId: item.question?.course?.instructorId } : null;
    }
    case 'discussion_post': {
      const item = await db.discussionPost.findUnique({
        where: { id },
        include: { user: { select: { id: true, name: true, email: true, status: true } }, course: { select: { id: true, title: true, instructorId: true } } },
      });
      return item ? { ...item, _userId: item.userId, _courseId: item.courseId, _instructorId: item.course?.instructorId } : null;
    }
    case 'discussion_reply': {
      const item = await db.discussionReply.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true, status: true } },
          post: { select: { id: true, courseId: true, course: { select: { id: true, title: true, instructorId: true } } } },
        },
      });
      return item ? { ...item, _userId: item.userId, _courseId: item.post?.courseId, _instructorId: item.post?.course?.instructorId } : null;
    }
    case 'review': {
      const item = await db.review.findUnique({
        where: { id },
        include: { user: { select: { id: true, name: true, email: true, status: true } }, course: { select: { id: true, title: true, instructorId: true } } },
      });
      return item ? { ...item, _userId: item.userId, _courseId: item.courseId, _instructorId: item.course?.instructorId } : null;
    }
    default:
      return null;
  }
}

// Update the item's moderation fields and optionally the content
async function updateItem(
  type: ContentType,
  id: string,
  data: {
    moderationStatus?: string;
    isFlagged?: boolean;
    content?: string;
    question?: string;
    moderatedAt: Date;
    moderatedBy: string;
  }
) {
  const { moderationStatus, isFlagged, content, question, moderatedAt, moderatedBy } = data;

  switch (type) {
    case 'qa_question':
      return db.qAQuestion.update({
        where: { id },
        data: {
          ...(moderationStatus !== undefined && { moderationStatus }),
          ...(isFlagged !== undefined && { isFlagged }),
          ...(question !== undefined && { question }),
          moderatedAt,
          moderatedBy,
        },
      });
    case 'qa_answer':
      return db.qAAnswer.update({
        where: { id },
        data: {
          ...(moderationStatus !== undefined && { moderationStatus }),
          ...(isFlagged !== undefined && { isFlagged }),
          ...(content !== undefined && { content }),
          moderatedAt,
          moderatedBy,
        },
      });
    case 'discussion_post':
      return db.discussionPost.update({
        where: { id },
        data: {
          ...(moderationStatus !== undefined && { moderationStatus }),
          ...(isFlagged !== undefined && { isFlagged }),
          ...(content !== undefined && { content }),
          moderatedAt,
          moderatedBy,
        },
      });
    case 'discussion_reply':
      return db.discussionReply.update({
        where: { id },
        data: {
          ...(moderationStatus !== undefined && { moderationStatus }),
          ...(isFlagged !== undefined && { isFlagged }),
          ...(content !== undefined && { content }),
          moderatedAt,
          moderatedBy,
        },
      });
    case 'review':
      return db.review.update({
        where: { id },
        data: {
          ...(moderationStatus !== undefined && { moderationStatus }),
          ...(isFlagged !== undefined && { isFlagged }),
          ...(content !== undefined && { content }),
          moderatedAt,
          moderatedBy,
        },
      });
  }
}

// Get display content for logging
function getItemContent(item: any, type: ContentType): string {
  switch (type) {
    case 'qa_question':
      return item.question || '';
    case 'qa_answer':
    case 'discussion_post':
    case 'discussion_reply':
    case 'review':
      return item.content || '';
    default:
      return '';
  }
}

// PATCH /api/admin/content-review/[id] — Moderate a flagged item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, action, adminId, reason } = body as {
      type: ContentType;
      action: ModerationAction;
      adminId?: string;
      reason?: string;
    };

    // Validate type and action
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: remove, remove_post, remove_review, keep, keep_post, keep_review, warn_user, suspend_user, ban_user, ban_account, escalate, contact_instructor, investigate_account, add_watchlist` },
        { status: 400 }
      );
    }

    // Normalize action: map frontend aliases to canonical backend actions
    const canonicalAction = ACTION_ALIASES[action] || action;

    // Fetch the item
    const item = await getItem(type, id);
    if (!item) {
      return NextResponse.json(
        { error: `${type} with id ${id} not found` },
        { status: 404 }
      );
    }

    const now = new Date();
    const moderatedBy = adminId || 'admin';
    const userId = item._userId as string;
    const userName = item.user?.name || 'Unknown User';
    const itemContentPreview = getItemContent(item, type).substring(0, 100);
    const typeLabel = type.replace(/_/g, ' ');

    // Check if user is an admin before allowing ban/suspend actions
    if (canonicalAction === 'ban_user' || canonicalAction === 'suspend_user') {
      const targetUser = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (targetUser?.role === 'admin') {
        return NextResponse.json(
          { error: 'Cannot moderate admin users' },
          { status: 403 }
        );
      }
    }

    switch (canonicalAction) {
      case 'remove': {
        const updateData: any = {
          moderationStatus: 'removed',
          moderatedAt: now,
          moderatedBy,
        };
        if (type === 'qa_question') {
          updateData.question = CONTENT_REMOVED_TEXT;
        } else {
          updateData.content = CONTENT_REMOVED_TEXT;
        }
        await updateItem(type, id, updateData);

        await db.activityLog.create({
          data: {
            userId,
            type: 'post_flagged',
            title: `Content removed: ${typeLabel}`,
            description: `${typeLabel} by ${userName} was removed by moderator. Reason: ${reason || 'No reason provided'}. Content preview: "${itemContentPreview}"`,
            icon: '🗑️',
            metadata: JSON.stringify({ contentId: id, contentType: type, action: 'remove', reason }),
          },
        });

        return NextResponse.json({ success: true, message: `${typeLabel} has been removed.` });
      }

      case 'keep': {
        await updateItem(type, id, {
          moderationStatus: 'kept',
          isFlagged: false,
          moderatedAt: now,
          moderatedBy,
        });

        await db.activityLog.create({
          data: {
            userId,
            type: 'post_flagged',
            title: `Content kept: ${typeLabel}`,
            description: `${typeLabel} by ${userName} was reviewed and kept. Reason: ${reason || 'Content is acceptable'}`,
            icon: '✅',
            metadata: JSON.stringify({ contentId: id, contentType: type, action: 'keep', reason }),
          },
        });

        return NextResponse.json({ success: true, message: `${typeLabel} has been reviewed and kept.` });
      }

      case 'warn_user': {
        await updateItem(type, id, {
          moderationStatus: 'kept',
          isFlagged: false,
          moderatedAt: now,
          moderatedBy,
        });

        await db.notification.create({
          data: {
            userId,
            type: 'system',
            title: 'Content Warning',
            content: `Your ${typeLabel} has been reviewed and a moderator has issued a warning. Reason: ${reason || 'Content flagged for review'}. Please review our community guidelines.`,
            icon: '⚠️',
            link: null,
          },
        });

        await db.activityLog.create({
          data: {
            userId,
            type: 'security_alert',
            title: `User warned: ${userName}`,
            description: `${typeLabel} reviewed and kept. User warned for: ${reason || 'Content flagged for review'}. Content preview: "${itemContentPreview}"`,
            icon: '⚠️',
            metadata: JSON.stringify({ contentId: id, contentType: type, action: 'warn_user', reason }),
          },
        });

        return NextResponse.json({ success: true, message: `${typeLabel} has been kept. User ${userName} has been warned.` });
      }

      case 'suspend_user': {
        const removeUpdateData: any = {
          moderationStatus: 'removed',
          moderatedAt: now,
          moderatedBy,
        };
        if (type === 'qa_question') {
          removeUpdateData.question = CONTENT_REMOVED_TEXT;
        } else {
          removeUpdateData.content = CONTENT_REMOVED_TEXT;
        }
        await updateItem(type, id, removeUpdateData);

        await db.user.update({
          where: { id: userId },
          data: {
            status: 'suspended',
            lockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });

        await db.notification.create({
          data: {
            userId,
            type: 'system',
            title: 'Account Suspended',
            content: `Your account has been suspended due to a content violation. Reason: ${reason || 'Violation of community guidelines'}. Contact support if you believe this is an error.`,
            icon: '🚫',
            link: null,
          },
        });

        await db.activityLog.create({
          data: {
            userId,
            type: 'security_alert',
            title: `User suspended: ${userName}`,
            description: `${typeLabel} removed and user suspended. Reason: ${reason || 'Violation of community guidelines'}. Content preview: "${itemContentPreview}"`,
            icon: '🚫',
            metadata: JSON.stringify({ contentId: id, contentType: type, action: 'suspend_user', reason }),
          },
        });

        return NextResponse.json({ success: true, message: `${typeLabel} has been removed. User ${userName} has been suspended.` });
      }

      case 'ban_user': {
        const removeUpdateData: any = {
          moderationStatus: 'removed',
          moderatedAt: now,
          moderatedBy,
        };
        if (type === 'qa_question') {
          removeUpdateData.question = CONTENT_REMOVED_TEXT;
        } else {
          removeUpdateData.content = CONTENT_REMOVED_TEXT;
        }
        await updateItem(type, id, removeUpdateData);

        await db.user.update({
          where: { id: userId },
          data: {
            status: 'banned',
            lockedUntil: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
          },
        });

        await db.activityLog.create({
          data: {
            userId,
            type: 'security_alert',
            title: `User banned: ${userName}`,
            description: `${typeLabel} removed and user permanently banned. Reason: ${reason || 'Severe violation of community guidelines'}. Content preview: "${itemContentPreview}"`,
            icon: '🔴',
            metadata: JSON.stringify({ contentId: id, contentType: type, action: 'ban_user', reason }),
          },
        });

        return NextResponse.json({ success: true, message: `${typeLabel} has been removed. User ${userName} has been permanently banned.` });
      }

      case 'escalate': {
        await updateItem(type, id, {
          moderationStatus: 'escalated',
          moderatedAt: now,
          moderatedBy,
        });

        await db.activityLog.create({
          data: {
            userId,
            type: 'post_flagged',
            title: `Content escalated: ${typeLabel}`,
            description: `${typeLabel} by ${userName} has been escalated for further review. Reason: ${reason || 'Requires higher-level review'}. Content preview: "${itemContentPreview}"`,
            icon: '⬆️',
            metadata: JSON.stringify({ contentId: id, contentType: type, action: 'escalate', reason }),
          },
        });

        return NextResponse.json({ success: true, message: `${typeLabel} has been escalated for further review.` });
      }

      case 'contact_instructor': {
        const instructorId = item._instructorId as string | null;

        if (instructorId) {
          await db.notification.create({
            data: {
              userId: instructorId,
              type: 'system',
              title: 'Flagged Content in Your Course',
              content: `A ${typeLabel} in your course has been flagged and requires your attention. Reason: ${reason || 'Content flagged for review'}. Please review and take appropriate action.`,
              icon: '📩',
              link: null,
              courseId: item._courseId as string,
            },
          });
        }

        await db.activityLog.create({
          data: {
            userId,
            type: 'post_flagged',
            title: `Instructor contacted about: ${typeLabel}`,
            description: `Instructor ${instructorId ? 'notified' : 'could not be notified (no instructor found)'} about flagged ${typeLabel} by ${userName}. Reason: ${reason || 'Content requires instructor review'}. Content preview: "${itemContentPreview}"`,
            icon: '📩',
            metadata: JSON.stringify({ contentId: id, contentType: type, action: 'contact_instructor', instructorId, reason }),
          },
        });

        return NextResponse.json({
          success: true,
          message: instructorId
            ? `Instructor has been notified about the flagged ${typeLabel}.`
            : `Activity logged. Could not find instructor for this content.`,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin content review moderate API error:', error);
    return NextResponse.json({ error: 'Failed to moderate content' }, { status: 500 });
  }
}
