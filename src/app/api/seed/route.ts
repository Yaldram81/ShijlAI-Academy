import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Always check the database directly — don't trust in-memory cache
    // because the server process may restart while the DB persists (or vice versa)
    const userCount = await db.user.count();
    if (userCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'Database already seeded',
        output: `Found ${userCount} existing users`,
      });
    }

    // Database is empty — run the seed script directly
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stdout, stderr } = await execAsync('npx tsx prisma/seed.ts', {
        cwd: process.cwd(),
        env: { ...process.env },
        timeout: 60000,
      });

      if (stderr && !stderr.includes('Seeding') && !stderr.includes('warn')) {
        console.error('Seed stderr:', stderr);
      }

      return NextResponse.json({
        success: true,
        message: 'Database seeded successfully',
        output: stdout,
      });
    } catch (seedError) {
      console.error('Seed execution error:', seedError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to execute seed command',
          error: seedError instanceof Error ? seedError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Seed check error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check/seed database',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
