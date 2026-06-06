import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const courseTitle = "React & Next.js Development – Modern Web Apps";
  const course = await prisma.course.findFirst({
    where: { title: courseTitle }
  });

  if (!course) {
    console.error(`Course "${courseTitle}" not found.`);
    process.exit(1);
  }

  console.log(`Found course: ${course.id}`);

  // Delete existing modules (cascade should delete lessons)
  await prisma.module.deleteMany({
    where: { courseId: course.id }
  });
  console.log('Deleted existing modules.');

  const modulesData = [
    {
      title: 'Module 1: Foundations of Modern React',
      description: 'Master the core concepts of React 18, including components, state, and the Virtual DOM.',
      lessons: [
        { title: 'Introduction to Modern React & Ecosystem', type: 'video', duration: 15 },
        { title: 'Understanding JSX and Component Architecture', type: 'video', duration: 25 },
        { title: 'State Management with Hooks (useState, useReducer)', type: 'video', duration: 30 },
        { title: 'Side Effects and Data Fetching (useEffect)', type: 'video', duration: 20 },
        { title: 'Assignment: Building a Dynamic Task Manager', type: 'assignment', duration: 45 },
      ]
    },
    {
      title: 'Module 2: Advanced React Patterns',
      description: 'Explore advanced component patterns, context, and performance optimization techniques.',
      lessons: [
        { title: 'The Context API and Global State', type: 'video', duration: 25 },
        { title: 'Custom Hooks for Reusable Logic', type: 'video', duration: 20 },
        { title: 'Performance Optimization (useMemo, useCallback)', type: 'video', duration: 35 },
        { title: 'Error Boundaries and Suspense', type: 'video', duration: 15 },
        { title: 'Quiz: Advanced React Concepts', type: 'quiz', duration: 10 },
      ]
    },
    {
      title: 'Module 3: Introduction to Next.js and SSR',
      description: 'Transition from pure React to Next.js, understanding Server-Side Rendering and routing.',
      lessons: [
        { title: 'Why Next.js? SSR vs CSR vs SSG', type: 'video', duration: 20 },
        { title: 'File-based Routing and Layouts', type: 'video', duration: 25 },
        { title: 'Data Fetching in Next.js (getServerSideProps, getStaticProps)', type: 'video', duration: 30 },
        { title: 'API Routes and Backend Integration', type: 'video', duration: 25 },
        { title: 'Assignment: Refactoring React to Next.js', type: 'assignment', duration: 60 },
      ]
    },
    {
      title: 'Module 4: The Next.js App Router',
      description: 'Deep dive into the modern Next.js App Router, Server Components, and Server Actions.',
      lessons: [
        { title: 'React Server Components (RSC) Explained', type: 'video', duration: 30 },
        { title: 'Routing, Navigation, and Streaming in App Router', type: 'video', duration: 25 },
        { title: 'Data Mutations with Server Actions', type: 'video', duration: 35 },
        { title: 'Handling Authentication and Middleware', type: 'video', duration: 30 },
        { title: 'Quiz: Mastering the App Router', type: 'quiz', duration: 15 },
      ]
    },
    {
      title: 'Module 5: Deployment, Testing, and Best Practices',
      description: 'Learn how to test, optimize, and deploy your Next.js applications to production.',
      lessons: [
        { title: 'Unit and Component Testing with Jest and React Testing Library', type: 'video', duration: 35 },
        { title: 'End-to-End Testing with Cypress', type: 'video', duration: 30 },
        { title: 'Web Vitals and Next.js Image/Font Optimization', type: 'video', duration: 20 },
        { title: 'Deploying to Vercel and CI/CD Pipelines', type: 'video', duration: 25 },
        { title: 'Final Project: Full-stack E-Commerce App', type: 'assignment', duration: 120 },
      ]
    }
  ];

  for (let mIdx = 0; mIdx < modulesData.length; mIdx++) {
    const modData = modulesData[mIdx];
    const createdModule = await prisma.module.create({
      data: {
        title: modData.title,
        description: modData.description,
        order: mIdx + 1,
        courseId: course.id,
        isPublished: true,
        lessons: {
          create: modData.lessons.map((lesson, lIdx) => ({
            title: lesson.title,
            description: `Comprehensive lesson on ${lesson.title}`,
            content: `# ${lesson.title}\n\nThis is the markdown content for ${lesson.title}. Follow along with the video and interactive exercises.`,
            type: lesson.type,
            duration: lesson.duration,
            order: lIdx + 1,
            isPublished: true,
            isFree: mIdx === 0 && lIdx === 0 // Make the first lesson free
          }))
        }
      }
    });
    console.log(`Created module: ${createdModule.title}`);
  }

  console.log('Successfully seeded professional modules and lessons!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
