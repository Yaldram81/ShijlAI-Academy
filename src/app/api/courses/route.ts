import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const search = searchParams.get('search')?.trim() || '';
    const categoryParam = searchParams.get('category') || '';
    const levelParam = searchParams.get('level') || '';
    const languageParam = searchParams.get('language') || '';
    const priceParam = searchParams.get('price') || '';
    const durationParam = searchParams.get('duration') || '';
    const ratingParam = searchParams.get('rating') || '';
    const certificateParam = searchParams.get('certificate') || '';
    const featuredParam = searchParams.get('featured') || '';
    const staffPickParam = searchParams.get('staffPick') || '';
    const hasFreeLessonsParam = searchParams.get('hasFreeLessons') || '';
    const sortParam = searchParams.get('sort') || 'relevance';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const userId = searchParams.get('userId') || '';

    // Validate userId if provided
    let validatedUserId = userId;
    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    }

    // Build where clause using AND array for composable filtering
    const andConditions: Prisma.CourseWhereInput[] = [
      { isPublished: true },
      { isArchived: false },
    ];

    // Category filter (comma-separated for multiple → OR within, AND with other filters)
    if (categoryParam) {
      const categories = categoryParam.split(',').map(c => c.trim()).filter(Boolean);
      if (categories.length === 1) {
        andConditions.push({ category: categories[0] });
      } else if (categories.length > 1) {
        andConditions.push({ category: { in: categories } });
      }
    }

    // Level filter (comma-separated for multiple)
    if (levelParam) {
      const levels = levelParam.split(',').map(l => l.trim()).filter(Boolean);
      if (levels.length === 1) {
        andConditions.push({ level: levels[0] });
      } else if (levels.length > 1) {
        andConditions.push({ level: { in: levels } });
      }
    }

    // Language filter (comma-separated for multiple)
    if (languageParam) {
      const languages = languageParam.split(',').map(l => l.trim()).filter(Boolean);
      if (languages.length === 1) {
        andConditions.push({ language: languages[0] });
      } else if (languages.length > 1) {
        andConditions.push({ language: { in: languages } });
      }
    }

    // Price filter (comma-separated for multiple → OR within, AND with other filters)
    if (priceParam) {
      const priceValues = priceParam.split(',').map(p => p.trim()).filter(Boolean);
      const priceOrConditions: Prisma.CourseWhereInput[] = [];

      for (const pv of priceValues) {
        switch (pv) {
          case 'free':
            priceOrConditions.push({ price: 0 });
            break;
          case 'paid':
            priceOrConditions.push({ price: { gt: 0 } });
            break;
          case 'under_1000':
            priceOrConditions.push({ price: { gt: 0, lte: 1000 } });
            break;
          case 'under_2000':
            priceOrConditions.push({ price: { gt: 0, lte: 2000 } });
            break;
          case 'under_5000':
            priceOrConditions.push({ price: { gt: 0, lte: 5000 } });
            break;
        }
      }

      if (priceOrConditions.length === 1) {
        andConditions.push(priceOrConditions[0]);
      } else if (priceOrConditions.length > 1) {
        andConditions.push({ OR: priceOrConditions });
      }
    }

    // Duration filter (comma-separated for multiple → OR within, AND with other filters)
    if (durationParam) {
      const durationValues = durationParam.split(',').map(d => d.trim()).filter(Boolean);
      const durationOrConditions: Prisma.CourseWhereInput[] = [];

      for (const dv of durationValues) {
        switch (dv) {
          case 'under_2h':
            durationOrConditions.push({ estimatedDuration: { gt: 0, lte: 2 } });
            break;
          case '2-5h':
            durationOrConditions.push({ estimatedDuration: { gte: 2, lte: 5 } });
            break;
          case '5-10h':
            durationOrConditions.push({ estimatedDuration: { gte: 6, lte: 10 } });
            break;
          case '10h_plus':
            durationOrConditions.push({ estimatedDuration: { gt: 10 } });
            break;
        }
      }

      if (durationOrConditions.length === 1) {
        andConditions.push(durationOrConditions[0]);
      } else if (durationOrConditions.length > 1) {
        andConditions.push({ OR: durationOrConditions });
      }
    }

    // Rating filter (minimum rating)
    if (ratingParam) {
      const minRating = parseFloat(ratingParam);
      if (!isNaN(minRating) && minRating > 0 && minRating <= 5) {
        andConditions.push({ rating: { gte: minRating } });
      }
    }

    // Certificate filter
    if (certificateParam === 'true') {
      andConditions.push({ certificateEnabled: true });
    }

    // Featured filter
    if (featuredParam === 'true') {
      andConditions.push({ featured: true });
    }

    // Staff Pick filter
    if (staffPickParam === 'true') {
      andConditions.push({ staffPick: true });
    }

    // Has free lessons filter — courses that have at least one free lesson
    if (hasFreeLessonsParam === 'true') {
      andConditions.push({
        modules: {
          some: {
            isPublished: true,
            lessons: {
              some: {
                isFree: true,
                isPublished: true,
              },
            },
          },
        },
      });
    }

    // Search filter - full-text on title, description, tags, category
    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean);
      if (searchTerms.length > 0) {
        // Each search term should match at least one field (OR within term)
        // All terms must match (AND between terms)
        const searchTermConditions = searchTerms.map(term => ({
          OR: [
            { title: { contains: term } },
            { description: { contains: term } },
            { tags: { contains: term } },
            { category: { contains: term } },
          ],
        }));
        andConditions.push(...searchTermConditions);
      }
    }

    // Build final where clause
    const whereConditions: Prisma.CourseWhereInput =
      andConditions.length === 1
        ? andConditions[0]
        : { AND: andConditions };

    // Determine sort order
    let orderBy: Prisma.CourseOrderByWithRelationInput;
    switch (sortParam) {
      case 'popular':
        orderBy = { enrollmentCount: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'highest_rated':
        orderBy = { rating: 'desc' };
        break;
      case 'price_low':
        orderBy = { price: 'asc' };
        break;
      case 'price_high':
        orderBy = { price: 'desc' };
        break;
      case 'relevance':
      default:
        if (search) {
          orderBy = { enrollmentCount: 'desc' };
        } else {
          orderBy = { createdAt: 'desc' };
        }
        break;
    }

    // Fetch courses and total count in parallel
    const [courses, total] = await Promise.all([
      db.course.findMany({
        where: whereConditions,
        include: {
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
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      db.course.count({ where: whereConditions }),
    ]);

    // Fetch user-specific data (wishlist & enrollment status) if userId provided
    let wishlistCourseIds: Set<string> = new Set();
    let enrolledCourseIds: Set<string> = new Set();

    if (validatedUserId) {
      const [wishlists, enrollments] = await Promise.all([
        db.wishlist.findMany({
          where: { userId: validatedUserId },
          select: { courseId: true },
        }),
        db.enrollment.findMany({
          where: { userId: validatedUserId },
          select: { courseId: true },
        }),
      ]);
      wishlistCourseIds = new Set(wishlists.map(w => w.courseId));
      enrolledCourseIds = new Set(enrollments.map(e => e.courseId));
    }

    // Add isWishlisted and isEnrolled to each course
    const coursesWithStatus = courses.map(course => ({
      ...course,
      isWishlisted: wishlistCourseIds.has(course.id),
      isEnrolled: enrolledCourseIds.has(course.id),
    }));

    // Build facets from the courses themselves (avoids groupBy issues with SQLite)
    const allMatchingCourses = await db.course.findMany({
      where: whereConditions,
      select: { category: true, level: true, price: true, language: true, certificateEnabled: true },
    });

    // Count categories
    const categoryMap = new Map<string, number>();
    const levelMap = new Map<string, number>();
    const languageMap = new Map<string, number>();
    let freeCount = 0;
    let paidCount = 0;
    let certificateCount = 0;
    for (const c of allMatchingCourses) {
      categoryMap.set(c.category, (categoryMap.get(c.category) || 0) + 1);
      levelMap.set(c.level, (levelMap.get(c.level) || 0) + 1);
      languageMap.set(c.language, (languageMap.get(c.language) || 0) + 1);
      if (c.price === 0) freeCount++;
      else paidCount++;
      if (c.certificateEnabled) certificateCount++;
    }
    const categoryFacets = [...categoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    const levelFacets = [...levelMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    const languageFacets = [...languageMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    const facets = {
      categories: categoryFacets,
      levels: levelFacets,
      languages: languageFacets,
      priceRange: {
        free: freeCount,
        paid: paidCount,
      },
      certificates: certificateCount,
    };

    return NextResponse.json({
      courses: coursesWithStatus,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      facets,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
