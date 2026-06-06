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

  // Find all lessons in this course that are of type 'video' and have no videoUrl
  const updated = await prisma.lesson.updateMany({
    where: {
      module: { courseId: course.id },
      type: 'video',
      videoUrl: null
    },
    data: {
      // Free sample video from internet
      videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    }
  });

  console.log(`Updated ${updated.count} lessons with a sample video URL.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
