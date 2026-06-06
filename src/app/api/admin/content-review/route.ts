import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Types for unified flagged content items
type FlaggedItemType = 'qa_question' | 'qa_answer' | 'discussion_post' | 'discussion_reply' | 'review';

interface FlaggedItem {
  id: string;
  type: FlaggedItemType;
  content: string;
  title: string | null;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    email: string;
    createdAt: string;
    status: string;
  } | null;
  course: {
    id: string;
    title: string;
  } | null;
  isFlagged: boolean;
  flaggedReason: string | null;
  flagCount: number;
  aiAssessment: string | null;
  moderationStatus: string;
  createdAt: string;
  rating: number | null;
  flaggedBy: string | null;
}

const userSelect = {
  id: true,
  name: true,
  avatar: true,
  email: true,
  createdAt: true,
  status: true,
} as const;

const courseSelect = {
  id: true,
  title: true,
} as const;

// GET /api/admin/content-review — List flagged content with tab filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'all'; // qa_reports | community_posts | reviews | all
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build search filter for content and user name
    const buildSearchFilter = (contentField: string) => {
      if (!search) return {};
      return {
        OR: [
          { [contentField]: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      };
    };

    // Fetch stats in parallel
    const [qaQuestionCount, qaAnswerCount, discussionPostCount, discussionReplyCount, reviewCount] =
      await Promise.all([
        db.qAQuestion.count({ where: { isFlagged: true } }),
        db.qAAnswer.count({ where: { isFlagged: true } }),
        db.discussionPost.count({ where: { isFlagged: true } }),
        db.discussionReply.count({ where: { isFlagged: true } }),
        db.review.count({ where: { isFlagged: true } }),
      ]);

    const stats = {
      courseReviews: qaQuestionCount,
      qaReports: qaQuestionCount + qaAnswerCount,
      communityPosts: discussionPostCount + discussionReplyCount,
      reviews: reviewCount,
    };

    let items: FlaggedItem[] = [];
    let total = 0;

    if (tab === 'qa_reports') {
      const [qaQuestions, qaAnswers, qCount, aCount] = await Promise.all([
        db.qAQuestion.findMany({
          where: { isFlagged: true, ...buildSearchFilter('question') },
          include: { user: { select: userSelect }, course: { select: courseSelect } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.qAAnswer.findMany({
          where: { isFlagged: true, ...buildSearchFilter('content') },
          include: { user: { select: userSelect }, question: { select: { id: true, courseId: true, course: { select: courseSelect } } } },
          orderBy: { createdAt: 'desc' },
        }),
        db.qAQuestion.count({ where: { isFlagged: true, ...(search ? buildSearchFilter('question') : {}) } }),
        db.qAAnswer.count({ where: { isFlagged: true, ...(search ? buildSearchFilter('content') : {}) } }),
      ]);

      const questionItems: FlaggedItem[] = qaQuestions.map((q) => ({
        id: q.id,
        type: 'qa_question' as FlaggedItemType,
        content: q.question,
        title: q.question,
        user: q.user ? { id: q.user.id, name: q.user.name, avatar: q.user.avatar, email: q.user.email, createdAt: q.user.createdAt.toISOString(), status: q.user.status } : null,
        course: q.course ? { id: q.course.id, title: q.course.title } : null,
        isFlagged: q.isFlagged,
        flaggedReason: q.flaggedReason,
        flagCount: q.flagCount,
        aiAssessment: q.aiAssessment,
        moderationStatus: q.moderationStatus,
        createdAt: q.createdAt.toISOString(),
        rating: null,
        flaggedBy: null,
      }));

      const answerItems: FlaggedItem[] = qaAnswers.map((a) => ({
        id: a.id,
        type: 'qa_answer' as FlaggedItemType,
        content: a.content,
        title: null,
        user: a.user ? { id: a.user.id, name: a.user.name, avatar: a.user.avatar, email: a.user.email, createdAt: a.user.createdAt.toISOString(), status: a.user.status } : null,
        course: a.question?.course ? { id: a.question.course.id, title: a.question.course.title } : null,
        isFlagged: a.isFlagged,
        flaggedReason: a.flaggedReason,
        flagCount: a.flagCount,
        aiAssessment: a.aiAssessment,
        moderationStatus: a.moderationStatus,
        createdAt: a.createdAt.toISOString(),
        rating: null,
        flaggedBy: null,
      }));

      items = [...questionItems, ...answerItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      total = qCount + aCount;
      items = items.slice(0, limit);

    } else if (tab === 'community_posts') {
      const [posts, replies, pCount, rCount] = await Promise.all([
        db.discussionPost.findMany({
          where: { isFlagged: true, ...buildSearchFilter('content') },
          include: { user: { select: userSelect }, course: { select: courseSelect } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.discussionReply.findMany({
          where: { isFlagged: true, ...buildSearchFilter('content') },
          include: { user: { select: userSelect }, post: { select: { id: true, courseId: true, course: { select: courseSelect } } } },
          orderBy: { createdAt: 'desc' },
        }),
        db.discussionPost.count({ where: { isFlagged: true, ...(search ? buildSearchFilter('content') : {}) } }),
        db.discussionReply.count({ where: { isFlagged: true, ...(search ? buildSearchFilter('content') : {}) } }),
      ]);

      const postItems: FlaggedItem[] = posts.map((p) => ({
        id: p.id,
        type: 'discussion_post' as FlaggedItemType,
        content: p.content,
        title: p.title,
        user: p.user ? { id: p.user.id, name: p.user.name, avatar: p.user.avatar, email: p.user.email, createdAt: p.user.createdAt.toISOString(), status: p.user.status } : null,
        course: p.course ? { id: p.course.id, title: p.course.title } : null,
        isFlagged: p.isFlagged,
        flaggedReason: p.flaggedReason,
        flagCount: p.flagCount,
        aiAssessment: p.aiAssessment,
        moderationStatus: p.moderationStatus,
        createdAt: p.createdAt.toISOString(),
        rating: null,
        flaggedBy: null,
      }));

      const replyItems: FlaggedItem[] = replies.map((r) => ({
        id: r.id,
        type: 'discussion_reply' as FlaggedItemType,
        content: r.content,
        title: null,
        user: r.user ? { id: r.user.id, name: r.user.name, avatar: r.user.avatar, email: r.user.email, createdAt: r.user.createdAt.toISOString(), status: r.user.status } : null,
        course: r.post?.course ? { id: r.post.course.id, title: r.post.course.title } : null,
        isFlagged: r.isFlagged,
        flaggedReason: r.flaggedReason,
        flagCount: r.flagCount,
        aiAssessment: r.aiAssessment,
        moderationStatus: r.moderationStatus,
        createdAt: r.createdAt.toISOString(),
        rating: null,
        flaggedBy: null,
      }));

      items = [...postItems, ...replyItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      total = pCount + rCount;
      items = items.slice(0, limit);

    } else if (tab === 'reviews') {
      const searchFilter = search
        ? { OR: [{ content: { contains: search } }, { user: { name: { contains: search } } }, { user: { email: { contains: search } } }] }
        : {};

      const [reviews, rCount] = await Promise.all([
        db.review.findMany({
          where: { isFlagged: true, ...searchFilter },
          include: { user: { select: userSelect }, course: { select: courseSelect } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.review.count({ where: { isFlagged: true, ...searchFilter } }),
      ]);

      items = reviews.map((r) => ({
        id: r.id,
        type: 'review' as FlaggedItemType,
        content: r.content || '',
        title: null,
        user: r.user ? { id: r.user.id, name: r.user.name, avatar: r.user.avatar, email: r.user.email, createdAt: r.user.createdAt.toISOString(), status: r.user.status } : null,
        course: r.course ? { id: r.course.id, title: r.course.title } : null,
        isFlagged: r.isFlagged,
        flaggedReason: r.flaggedReason,
        flagCount: r.flagCount,
        aiAssessment: r.aiAssessment,
        moderationStatus: r.moderationStatus,
        createdAt: r.createdAt.toISOString(),
        rating: r.rating,
        flaggedBy: r.flaggedBy,
      }));
      total = rCount;

    } else {
      // 'all' tab — combine all flagged items
      const buildSearchFilterAll = (contentField: string, extraFields?: string[]) => {
        if (!search) return {};
        const orClauses: any[] = [
          { [contentField]: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ];
        if (extraFields) {
          for (const field of extraFields) {
            orClauses.push({ [field]: { contains: search } });
          }
        }
        return { OR: orClauses };
      };

      const [qaQuestions, qaAnswers, discPosts, discReplies, reviews] = await Promise.all([
        db.qAQuestion.findMany({
          where: { isFlagged: true, ...buildSearchFilterAll('question') },
          include: { user: { select: userSelect }, course: { select: courseSelect } },
        }),
        db.qAAnswer.findMany({
          where: { isFlagged: true, ...buildSearchFilterAll('content') },
          include: { user: { select: userSelect }, question: { select: { id: true, courseId: true, course: { select: courseSelect } } } },
        }),
        db.discussionPost.findMany({
          where: { isFlagged: true, ...buildSearchFilterAll('content', ['title']) },
          include: { user: { select: userSelect }, course: { select: courseSelect } },
        }),
        db.discussionReply.findMany({
          where: { isFlagged: true, ...buildSearchFilterAll('content') },
          include: { user: { select: userSelect }, post: { select: { id: true, courseId: true, course: { select: courseSelect } } } },
        }),
        db.review.findMany({
          where: { isFlagged: true, ...buildSearchFilterAll('content') },
          include: { user: { select: userSelect }, course: { select: courseSelect } },
        }),
      ]);

      const allItems: FlaggedItem[] = [
        ...qaQuestions.map((q) => ({
          id: q.id, type: 'qa_question' as FlaggedItemType, content: q.question, title: q.question,
          user: q.user ? { id: q.user.id, name: q.user.name, avatar: q.user.avatar, email: q.user.email, createdAt: q.user.createdAt.toISOString(), status: q.user.status } : null,
          course: q.course ? { id: q.course.id, title: q.course.title } : null,
          isFlagged: q.isFlagged, flaggedReason: q.flaggedReason, flagCount: q.flagCount, aiAssessment: q.aiAssessment, moderationStatus: q.moderationStatus,
          createdAt: q.createdAt.toISOString(), rating: null as const, flaggedBy: null as const,
        })),
        ...qaAnswers.map((a) => ({
          id: a.id, type: 'qa_answer' as FlaggedItemType, content: a.content, title: null as const,
          user: a.user ? { id: a.user.id, name: a.user.name, avatar: a.user.avatar, email: a.user.email, createdAt: a.user.createdAt.toISOString(), status: a.user.status } : null,
          course: a.question?.course ? { id: a.question.course.id, title: a.question.course.title } : null,
          isFlagged: a.isFlagged, flaggedReason: a.flaggedReason, flagCount: a.flagCount, aiAssessment: a.aiAssessment, moderationStatus: a.moderationStatus,
          createdAt: a.createdAt.toISOString(), rating: null as const, flaggedBy: null as const,
        })),
        ...discPosts.map((p) => ({
          id: p.id, type: 'discussion_post' as FlaggedItemType, content: p.content, title: p.title,
          user: p.user ? { id: p.user.id, name: p.user.name, avatar: p.user.avatar, email: p.user.email, createdAt: p.user.createdAt.toISOString(), status: p.user.status } : null,
          course: p.course ? { id: p.course.id, title: p.course.title } : null,
          isFlagged: p.isFlagged, flaggedReason: p.flaggedReason, flagCount: p.flagCount, aiAssessment: p.aiAssessment, moderationStatus: p.moderationStatus,
          createdAt: p.createdAt.toISOString(), rating: null as const, flaggedBy: null as const,
        })),
        ...discReplies.map((r) => ({
          id: r.id, type: 'discussion_reply' as FlaggedItemType, content: r.content, title: null as const,
          user: r.user ? { id: r.user.id, name: r.user.name, avatar: r.user.avatar, email: r.user.email, createdAt: r.user.createdAt.toISOString(), status: r.user.status } : null,
          course: r.post?.course ? { id: r.post.course.id, title: r.post.course.title } : null,
          isFlagged: r.isFlagged, flaggedReason: r.flaggedReason, flagCount: r.flagCount, aiAssessment: r.aiAssessment, moderationStatus: r.moderationStatus,
          createdAt: r.createdAt.toISOString(), rating: null as const, flaggedBy: null as const,
        })),
        ...reviews.map((r) => ({
          id: r.id, type: 'review' as FlaggedItemType, content: r.content || '', title: null as const,
          user: r.user ? { id: r.user.id, name: r.user.name, avatar: r.user.avatar, email: r.user.email, createdAt: r.user.createdAt.toISOString(), status: r.user.status } : null,
          course: r.course ? { id: r.course.id, title: r.course.title } : null,
          isFlagged: r.isFlagged, flaggedReason: r.flaggedReason, flagCount: r.flagCount, aiAssessment: r.aiAssessment, moderationStatus: r.moderationStatus,
          createdAt: r.createdAt.toISOString(), rating: r.rating, flaggedBy: r.flaggedBy,
        })),
      ];

      allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      total = allItems.length;
      items = allItems.slice(skip, skip + limit);
    }

    return NextResponse.json({
      items,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin content review list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flagged content' },
      { status: 500 }
    );
  }
}
