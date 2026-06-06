import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Run aggregates in parallel for performance
    const [
      totalStudents,
      totalCourses,
      totalCertificates,
      ratingAgg,
      topInstructorsRaw
    ] = await Promise.all([
      db.user.count({ where: { role: 'student' } }),
      db.course.count({ where: { isPublished: true } }),
      db.certificate.count(),
      db.review.aggregate({ _avg: { rating: true } }),
      
      // Get top instructors based on enrollment count
      db.user.findMany({
        where: { role: 'instructor' },
        select: {
          id: true,
          name: true,
          avatar: true,
          instructorProfile: {
            select: { headline: true }
          },
          coursesCreated: {
            where: { isPublished: true },
            select: {
              _count: {
                select: { enrollments: true }
              },
              rating: true
            }
          }
        }
      })
    ])

    // Format top instructors
    const topInstructors = topInstructorsRaw
      .map(instructor => {
        const studentCount = instructor.coursesCreated.reduce((acc, course) => acc + course._count.enrollments, 0)
        
        // Calculate average rating across all their courses
        const coursesWithRating = instructor.coursesCreated.filter(c => c.rating > 0)
        const avgRating = coursesWithRating.length > 0
          ? coursesWithRating.reduce((acc, course) => acc + course.rating, 0) / coursesWithRating.length
          : 0

        // Extract initials
        const initials = instructor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

        return {
          id: instructor.id,
          name: instructor.name,
          avatar: instructor.avatar,
          subject: instructor.instructorProfile?.headline || 'Expert Instructor',
          rating: Number(avgRating.toFixed(1)),
          studentCount,
          initials
        }
      })
      // Sort by student count descending and take top 3
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 3)

    return NextResponse.json({
      stats: {
        totalStudents,
        totalCourses,
        avgRating: Number((ratingAgg._avg.rating || 0).toFixed(1)),
        totalCertificates
      },
      topInstructors
    })
  } catch (error) {
    console.error('Failed to fetch landing stats:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
