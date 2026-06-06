import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fetching users and courses...')
  const users = await prisma.user.findMany({ where: { role: 'student' }, take: 2 })
  const course = await prisma.course.findFirst()

  if (!users.length || !course) {
    console.error('No users or courses found to associate with discussions.')
    return
  }

  const discussions = [
    {
      title: 'How do you handle state management in Next.js?',
      content: 'I have been using Zustand and context, but I wanted to know what everyone else uses for global state.',
      courseId: course.id,
      userId: users[0].id,
      upvotes: 12,
      replyCount: 3,
    },
    {
      title: 'Stuck on module 3 assignment',
      content: 'Can anyone help me understand why my flexbox layout is breaking on mobile screens?',
      courseId: course.id,
      userId: users[1 % users.length].id,
      upvotes: 5,
      replyCount: 1,
    },
    {
      title: 'Best resources for practicing Python?',
      content: 'What are the best websites or tools for a beginner to practice Python problems daily?',
      courseId: course.id,
      userId: users[0].id,
      upvotes: 8,
      replyCount: 4,
    },
    {
      title: 'Is Tailwind CSS better than standard CSS Modules?',
      content: 'I see a lot of debate on this. Would love to hear thoughts from experienced developers.',
      courseId: course.id,
      userId: users[1 % users.length].id,
      upvotes: 20,
      replyCount: 7,
    },
    {
      title: 'Question about the Final Project requirements',
      content: 'Do we have to implement authentication, or is it optional? The prompt is a bit ambiguous.',
      courseId: course.id,
      userId: users[0].id,
      upvotes: 15,
      replyCount: 2,
    }
  ]

  console.log('Seeding 5 discussions...')
  for (const data of discussions) {
    await prisma.discussionPost.create({ data })
  }

  console.log('Discussions seeded successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
