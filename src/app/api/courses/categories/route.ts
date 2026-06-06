import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Category icon mapping
const CATEGORY_ICONS: Record<string, string> = {
  'IB': '📚',
  'AP': '🏫',
  'Cambridge': '🎓',
  'IELTS': '🌍',
  'AWS': '☁️',
  'Programming': '💻',
  'Data Science': '📊',
  'Django': '🐍',
  'Web Development': '🌐',
  'Git': '🔀',
  'Mathematics': '🔢',
  'Business': '💼',
  'Design': '🎨',
  'Marketing': '📈',
  'Science': '🔬',
  'Language': '🗣️',
  'Music': '🎵',
  'Photography': '📷',
  'Health': '🏥',
  'Finance': '💰',
  'Tech': '💻',
  'AI': '🤖',
  'Machine Learning': '🧠',
  'Cybersecurity': '🔐',
  'Mobile Development': '📱',
  'Game Development': '🎮',
  'DevOps': '⚙️',
  'Blockchain': '⛓️',
  'Cloud Computing': '☁️',
  'Database': '🗄️',
};

function getCategoryIcon(category: string): string {
  // Exact match first
  if (CATEGORY_ICONS[category]) {
    return CATEGORY_ICONS[category];
  }
  // Case-insensitive match
  const lowerCategory = category.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.toLowerCase() === lowerCategory) {
      return icon;
    }
  }
  // Partial match
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (category.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
      return icon;
    }
  }
  // Default icon
  return '📖';
}

export async function GET() {
  try {
    // Get category counts from published, non-archived courses
    const categoryGroups = await db.course.groupBy({
      by: ['category'],
      where: {
        isPublished: true,
        isArchived: false,
      },
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
    });

    const categories = categoryGroups.map(group => ({
      name: group.category,
      count: group._count.category,
      icon: getCategoryIcon(group.category),
    }));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
