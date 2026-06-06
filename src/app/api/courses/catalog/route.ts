import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

interface CourseWithExtras {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  language: string;
  thumbnail: string | null;
  price: number;
  rating: number;
  enrollmentCount: number;
  estimatedDuration: number;
  tags: string | null;
  createdAt: Date;
  instructorId: string;
  instructor: { id: string; name: string; avatar: string | null };
  _count: { enrollments: number; modules: number; reviews: number };
  isWishlisted?: boolean;
  isEnrolled?: boolean;
}

const baseInclude = {
  instructor: {
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  },
  _count: {
    select: {
      enrollments: true,
      modules: true,
      reviews: true,
    },
  },
};

const publishedWhere: Prisma.CourseWhereInput = {
  isPublished: true,
  isArchived: false,
};

async function getUserStatus(userId: string, courseIds: string[]) {
  if (!userId || courseIds.length === 0) {
    return { wishlistIds: new Set<string>(), enrolledIds: new Set<string>() };
  }
  const [wishlists, enrollments] = await Promise.all([
    db.wishlist.findMany({
      where: { userId, courseId: { in: courseIds } },
      select: { courseId: true },
    }),
    db.enrollment.findMany({
      where: { userId, courseId: { in: courseIds } },
      select: { courseId: true },
    }),
  ]);
  return {
    wishlistIds: new Set(wishlists.map(w => w.courseId)),
    enrolledIds: new Set(enrollments.map(e => e.courseId)),
  };
}

function addStatusToCourses(
  courses: CourseWithExtras[],
  wishlistIds: Set<string>,
  enrolledIds: Set<string>
): CourseWithExtras[] {
  return courses.map(course => ({
    ...course,
    isWishlisted: wishlistIds.has(course.id),
    isEnrolled: enrolledIds.has(course.id),
  }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '';
    const section = searchParams.get('section') || '';
    const category = searchParams.get('category') || '';
    const sectionLimit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10'), 1), 50);
    const includeCategories = searchParams.get('includeCategories') === 'true';

    // Validate userId if provided
    let validatedUserId = userId;
    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    }

    // If a specific section is requested, return only that section
    if (section) {
      const sectionData = await buildSection(section, sectionLimit, validatedUserId, category);
      if (!sectionData) {
        return NextResponse.json(
          { error: `Invalid section: ${section}. Valid sections: featured, top, recommended, trending, free, newest` },
          { status: 400 }
        );
      }
      return NextResponse.json({ [section]: sectionData });
    }

    // Build all sections in parallel
    const [featured, top, recommended, trending, freeCourses, newest] = await Promise.all([
      buildSection('featured', sectionLimit, validatedUserId),
      buildSection('top', sectionLimit, validatedUserId),
      buildSection('recommended', sectionLimit, validatedUserId),
      buildSection('trending', sectionLimit, validatedUserId),
      buildSection('free', sectionLimit, validatedUserId),
      buildSection('newest', sectionLimit, validatedUserId),
    ]);

    // Build category sections if requested
    let categorySections: { name: string; icon: string; count: number; section: { courses: CourseWithExtras[]; reason: string } }[] = [];
    if (includeCategories) {
      const topCategories = await db.course.groupBy({
        by: ['category'],
        where: { isPublished: true, isArchived: false },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 5,
      });

      const categoryIcons: Record<string, string> = {
        IB: '📚', AP: '🏫', Cambridge: '🎓', IELTS: '🌍', AWS: '☁️',
        Programming: '💻', Tech: '💻', Business: '💼', Design: '🎨', Language: '🗣️',
        Sciences: '🔬', Arts: '🎨', 'Web Dev': '🌐', Python: '🐍', 'Data Science': '📊',
        Django: '🐍', 'Web Development': '🌐', Git: '🔀', Mathematics: '🔢',
      };

      const catResults = await Promise.all(
        topCategories.map(async (cat) => {
          const sectionData = await buildSection('category', sectionLimit, validatedUserId, cat.category);
          return {
            name: cat.category,
            icon: categoryIcons[cat.category] || '📖',
            count: cat._count.category,
            section: sectionData!,
          };
        })
      );
      categorySections = catResults;
    }

    return NextResponse.json({
      featured,
      top,
      recommended,
      trending,
      free: freeCourses,
      newest,
      categories: categorySections,
    });
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return NextResponse.json(
      { error: 'Failed to fetch catalog' },
      { status: 500 }
    );
  }
}

async function buildSection(
  sectionName: string,
  limit: number,
  userId: string,
  category?: string
): Promise<{ courses: CourseWithExtras[]; reason: string } | null> {
  switch (sectionName) {
    case 'featured':
      return buildFeaturedSection(limit, userId);
    case 'top':
      return buildTopSection(limit, userId);
    case 'recommended':
      return buildRecommendedSection(limit, userId);
    case 'trending':
      return buildTrendingSection(limit, userId);
    case 'free':
      return buildFreeSection(limit, userId);
    case 'newest':
      return buildNewestSection(limit, userId);
    case 'category':
      return buildCategorySection(limit, userId, category || '');
    default:
      return null;
  }
}

async function buildFeaturedSection(limit: number, userId: string) {
  // Featured courses — either explicitly flagged as featured or staff picks
  let courses = await db.course.findMany({
    where: {
      ...publishedWhere,
      featured: true,
    },
    include: baseInclude,
    orderBy: { rating: 'desc' },
    take: limit,
  }) as CourseWithExtras[];

  // If not enough featured courses, supplement with staff picks or top-rated
  if (courses.length < limit) {
    const existingIds = new Set(courses.map(c => c.id));
    const extras = await db.course.findMany({
      where: {
        ...publishedWhere,
        featured: false,
        id: { notIn: [...existingIds] },
        OR: [
          { staffPick: true },
          { rating: { gte: 4.5 } },
        ],
      },
      include: baseInclude,
      orderBy: { rating: 'desc' },
      take: limit - courses.length,
    }) as CourseWithExtras[];
    courses = [...courses, ...extras];
  }

  // If still not enough, fill with highest-rated
  if (courses.length < limit) {
    const existingIds = new Set(courses.map(c => c.id));
    const extras = await db.course.findMany({
      where: {
        ...publishedWhere,
        id: { notIn: [...existingIds] },
      },
      include: baseInclude,
      orderBy: [{ rating: 'desc' }, { enrollmentCount: 'desc' }],
      take: limit - courses.length,
    }) as CourseWithExtras[];
    courses = [...courses, ...extras];
  }

  if (userId && courses.length > 0) {
    const { wishlistIds, enrolledIds } = await getUserStatus(userId, courses.map(c => c.id));
    courses = addStatusToCourses(courses, wishlistIds, enrolledIds);
  }

  return {
    courses,
    reason: 'Handpicked by our team',
  };
}

async function buildTopSection(limit: number, userId: string) {
  // Top courses — composite score of rating * enrollment count
  const allCourses = await db.course.findMany({
    where: publishedWhere,
    include: baseInclude,
  });

  const scored = allCourses.map(course => {
    const rating = course.rating || 0;
    const enrollments = course.enrollmentCount || 0;
    const topScore = rating * Math.log(enrollments + 1) * 10;
    return { course, topScore };
  });

  scored.sort((a, b) => b.topScore - a.topScore);
  let courses: CourseWithExtras[] = scored.slice(0, limit).map(s => s.course as CourseWithExtras);

  if (userId && courses.length > 0) {
    const { wishlistIds, enrolledIds } = await getUserStatus(userId, courses.map(c => c.id));
    courses = addStatusToCourses(courses, wishlistIds, enrolledIds);
  }

  return {
    courses,
    reason: 'Highest rated & most popular',
  };
}

async function buildCategorySection(limit: number, userId: string, category: string) {
  if (!category) return null;

  let courses = await db.course.findMany({
    where: {
      ...publishedWhere,
      category,
    },
    include: baseInclude,
    orderBy: [{ enrollmentCount: 'desc' }, { rating: 'desc' }],
    take: limit,
  }) as CourseWithExtras[];

  if (userId && courses.length > 0) {
    const { wishlistIds, enrolledIds } = await getUserStatus(userId, courses.map(c => c.id));
    courses = addStatusToCourses(courses, wishlistIds, enrolledIds);
  }

  return {
    courses,
    reason: `Top ${category} courses`,
  };
}

async function buildRecommendedSection(limit: number, userId: string) {
  let courses: CourseWithExtras[];
  let reason = 'Popular courses you might like';

  if (userId) {
    // Get user's enrolled course categories
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      select: {
        courseId: true,
        course: {
          select: { category: true, tags: true },
        },
      },
    });

    const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));
    const userCategories = [...new Set(enrollments.map(e => e.course.category))];
    const userTags: string[] = [];
    enrollments.forEach(e => {
      if (e.course.tags) {
        try {
          const tags = JSON.parse(e.course.tags);
          if (Array.isArray(tags)) userTags.push(...tags);
        } catch {
          // ignore
        }
      }
    });

    if (userCategories.length > 0) {
      // Find courses in same categories that user hasn't enrolled in
      const candidateCourses = await db.course.findMany({
        where: {
          ...publishedWhere,
          category: { in: userCategories },
          id: { notIn: [...enrolledCourseIds] },
        },
        include: baseInclude,
        orderBy: { rating: 'desc' },
        take: limit * 3, // Fetch more for scoring
      });

      // Score by tag overlap + rating + enrollment
      const scored = candidateCourses.map(course => {
        let score = 0;
        // Tag overlap bonus
        if (course.tags) {
          try {
            const courseTags = JSON.parse(course.tags);
            if (Array.isArray(courseTags)) {
              const overlap = courseTags.filter((t: string) => userTags.includes(t));
              score += overlap.length * 10;
            }
          } catch {
            // ignore
          }
        }
        // Rating score
        score += (course.rating || 0) * 5;
        // Enrollment count score (normalized)
        score += Math.min((course.enrollmentCount || 0) / 100, 5);

        return { course, score };
      });

      scored.sort((a, b) => b.score - a.score);
      courses = scored.slice(0, limit).map(s => s.course as CourseWithExtras);

      reason = userCategories.length <= 2
        ? `Based on your interest in ${userCategories.join(' and ')}`
        : `Based on your learning history`;
    } else {
      // No enrollment history, fallback to popular
      courses = await db.course.findMany({
        where: publishedWhere,
        include: baseInclude,
        orderBy: { enrollmentCount: 'desc' },
        take: limit,
      }) as CourseWithExtras[];
      reason = 'Popular courses to start learning';
    }
  } else {
    // No userId, return popular courses
    courses = await db.course.findMany({
      where: publishedWhere,
      include: baseInclude,
      orderBy: { enrollmentCount: 'desc' },
      take: limit,
    }) as CourseWithExtras[];
    reason = 'Popular courses to start learning';
  }

  // Add user status
  if (userId && courses.length > 0) {
    const { wishlistIds, enrolledIds } = await getUserStatus(userId, courses.map(c => c.id));
    courses = addStatusToCourses(courses, wishlistIds, enrolledIds);
  }

  return { courses, reason };
}

async function buildTrendingSection(limit: number, userId: string) {
  // Trending = high enrollment momentum (enrollmentCount weighted with rating)
  // Since we don't have time-series data, we use a composite score:
  // score = enrollmentCount * (rating / 5) to weight by both popularity and quality
  const allCourses = await db.course.findMany({
    where: publishedWhere,
    include: baseInclude,
  });

  // Compute trending score
  const scored = allCourses.map(course => {
    const ratingWeight = (course.rating || 0) / 5;
    const trendScore = (course.enrollmentCount || 0) * Math.max(ratingWeight, 0.5);
    return { course, trendScore };
  });

  scored.sort((a, b) => b.trendScore - a.trendScore);
  let courses: CourseWithExtras[] = scored.slice(0, limit).map(s => s.course as CourseWithExtras);

  // Add user status
  if (userId && courses.length > 0) {
    const { wishlistIds, enrolledIds } = await getUserStatus(userId, courses.map(c => c.id));
    courses = addStatusToCourses(courses, wishlistIds, enrolledIds);
  }

  return {
    courses,
    reason: 'Popular worldwide 🌐',
  };
}

async function buildFreeSection(limit: number, userId: string) {
  let courses = await db.course.findMany({
    where: {
      ...publishedWhere,
      price: 0,
    },
    include: baseInclude,
    orderBy: { enrollmentCount: 'desc' },
    take: limit,
  }) as CourseWithExtras[];

  // Add user status
  if (userId && courses.length > 0) {
    const { wishlistIds, enrolledIds } = await getUserStatus(userId, courses.map(c => c.id));
    courses = addStatusToCourses(courses, wishlistIds, enrolledIds);
  }

  return {
    courses,
    reason: 'Free courses',
  };
}

async function buildNewestSection(limit: number, userId: string) {
  let courses = await db.course.findMany({
    where: publishedWhere,
    include: baseInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
  }) as CourseWithExtras[];

  // Add user status
  if (userId && courses.length > 0) {
    const { wishlistIds, enrolledIds } = await getUserStatus(userId, courses.map(c => c.id));
    courses = addStatusToCourses(courses, wishlistIds, enrolledIds);
  }

  return {
    courses,
    reason: 'Recently added',
  };
}
