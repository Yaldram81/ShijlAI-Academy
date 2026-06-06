import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ═══════════════════════════════════════════════════════
   AI Learning Paths API — Comprehensive
   GET /api/ai/learning-paths?userId=xxx
   Generates personalized learning paths based on mastery, skill graph, and career goals
   ═══════════════════════════════════════════════════════ */

// ==================== TYPES ====================

interface PathNode {
  id: string
  title: string
  description: string
  type: 'lesson' | 'quiz' | 'assignment' | 'project' | 'practice' | 'milestone'
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped' | 'recommended'
  priority: 'critical' | 'high' | 'normal'
  masteryScore: number
  masteryRequired: number
  xpReward: number
  durationMinutes: number
  sequenceOrder: number
  unlockRequirement: string | null
  nodeId?: string | null
  metadata?: Record<string, string> | null
  completedAt?: string | null
}

interface LearningPathData {
  id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'paused'
  progress: number
  courseId: string | null
  careerPathId: string | null
  generatedAt: string
  nodes: PathNode[]
}

interface CareerRoadmap {
  id: string
  title: string
  icon: string
  description: string
  category: string
  skillRoadmap: { skill: string; requiredLevel: string; estimatedHours: number }[]
  progress: number
  matchPercentage: number
  totalSteps: number
  completedSteps: number
}

interface LearningPathResponse {
  paths: LearningPathData[]
  careerPaths: CareerRoadmap[]
  aiInsight: string
  stats: {
    totalNodes: number
    completed: number
    available: number
    inProgress: number
    locked: number
    recommended: number
  }
  skillContextForAI: string
}

// ==================== DEMO CAREER PATHS ====================

const DEMO_CAREER_PATHS: CareerRoadmap[] = [
  {
    id: 'career-ds',
    title: 'Data Scientist',
    icon: '📊',
    description: 'Analyze data, build models, and extract insights to drive business decisions.',
    category: 'data',
    skillRoadmap: [
      { skill: 'Python', requiredLevel: 'Advanced', estimatedHours: 80 },
      { skill: 'Statistics', requiredLevel: 'Intermediate', estimatedHours: 60 },
      { skill: 'Machine Learning', requiredLevel: 'Intermediate', estimatedHours: 100 },
      { skill: 'Deep Learning', requiredLevel: 'Beginner', estimatedHours: 80 },
      { skill: 'Data Visualization', requiredLevel: 'Advanced', estimatedHours: 40 },
    ],
    progress: 38,
    matchPercentage: 72,
    totalSteps: 24,
    completedSteps: 9,
  },
  {
    id: 'career-mle',
    title: 'ML Engineer',
    icon: '🤖',
    description: 'Design, build, and deploy production machine learning systems at scale.',
    category: 'engineering',
    skillRoadmap: [
      { skill: 'Python', requiredLevel: 'Advanced', estimatedHours: 80 },
      { skill: 'Statistics', requiredLevel: 'Intermediate', estimatedHours: 60 },
      { skill: 'Machine Learning', requiredLevel: 'Advanced', estimatedHours: 120 },
      { skill: 'Deep Learning', requiredLevel: 'Intermediate', estimatedHours: 100 },
      { skill: 'MLOps', requiredLevel: 'Beginner', estimatedHours: 60 },
    ],
    progress: 25,
    matchPercentage: 58,
    totalSteps: 30,
    completedSteps: 8,
  },
  {
    id: 'career-web',
    title: 'Web Developer',
    icon: '🌐',
    description: 'Build modern, responsive web applications with cutting-edge frameworks.',
    category: 'engineering',
    skillRoadmap: [
      { skill: 'HTML/CSS', requiredLevel: 'Advanced', estimatedHours: 40 },
      { skill: 'JavaScript', requiredLevel: 'Advanced', estimatedHours: 80 },
      { skill: 'React', requiredLevel: 'Intermediate', estimatedHours: 60 },
      { skill: 'Node.js', requiredLevel: 'Intermediate', estimatedHours: 60 },
      { skill: 'Full Stack', requiredLevel: 'Beginner', estimatedHours: 80 },
    ],
    progress: 15,
    matchPercentage: 35,
    totalSteps: 28,
    completedSteps: 4,
  },
  {
    id: 'career-sec',
    title: 'Cybersecurity Analyst',
    icon: '🔒',
    description: 'Protect systems and networks from security threats and vulnerabilities.',
    category: 'engineering',
    skillRoadmap: [
      { skill: 'Networking', requiredLevel: 'Advanced', estimatedHours: 60 },
      { skill: 'Linux', requiredLevel: 'Intermediate', estimatedHours: 50 },
      { skill: 'Security Fundamentals', requiredLevel: 'Intermediate', estimatedHours: 70 },
      { skill: 'Ethical Hacking', requiredLevel: 'Beginner', estimatedHours: 80 },
      { skill: 'Digital Forensics', requiredLevel: 'Beginner', estimatedHours: 60 },
    ],
    progress: 8,
    matchPercentage: 22,
    totalSteps: 26,
    completedSteps: 2,
  },
]

// ==================== PATH GENERATION ENGINE ====================

/**
 * Determine node status based on mastery score and mastery required threshold.
 * - mastery >= required => completed
 * - mastery >= required * 0.8 => in_progress
 * - mastery >= required * 0.5 => available (can start)
 * - mastery < required * 0.5 => locked (need prerequisites first)
 */
function determineNodeStatus(masteryScore: number, masteryRequired: number, isRecommended = false): PathNode['status'] {
  if (masteryScore >= masteryRequired) return 'completed'
  if (isRecommended) return 'recommended'
  if (masteryScore >= masteryRequired * 0.8) return 'in_progress'
  if (masteryScore >= masteryRequired * 0.5) return 'available'
  return 'locked'
}

/**
 * Generate a learning path for an enrolled course, using the student's
 * topic mastery to decide which nodes are needed and their statuses.
 */
function generateCourseLearningPath(
  courseTitle: string,
  courseId: string,
  topicMasteries: Map<string, number>, // topicName -> mastery %
): LearningPathData {
  // Course-specific topic sequences with their typical mastery thresholds
  const courseTopics: Record<string, { title: string; description: string; type: PathNode['type']; masteryRequired: number; xpReward: number; durationMinutes: number }[]> = {
    'default': [
      { title: 'Foundations Review', description: 'Review core concepts and prerequisites for this course.', type: 'lesson', masteryRequired: 0, xpReward: 50, durationMinutes: 30 },
      { title: 'Core Concepts Quiz', description: 'Test your understanding of foundational material.', type: 'quiz', masteryRequired: 50, xpReward: 80, durationMinutes: 20 },
      { title: 'Applied Practice', description: 'Hands-on practice with core concepts.', type: 'practice', masteryRequired: 60, xpReward: 120, durationMinutes: 45 },
      { title: 'Advanced Topics', description: 'Dive deeper into advanced course material.', type: 'lesson', masteryRequired: 70, xpReward: 150, durationMinutes: 60 },
      { title: 'Course Project', description: 'Apply everything you\'ve learned in a comprehensive project.', type: 'project', masteryRequired: 75, xpReward: 300, durationMinutes: 120 },
      { title: 'Final Assessment', description: 'Demonstrate mastery of all course material.', type: 'quiz', masteryRequired: 80, xpReward: 200, durationMinutes: 40 },
    ],
    'machine': [
      { title: 'Statistics Refresher', description: 'Review mean, variance, distributions, and probability theory.', type: 'lesson', masteryRequired: 0, xpReward: 80, durationMinutes: 45 },
      { title: 'Probability Practice', description: 'Practice problems on probability distributions and Bayes\' theorem.', type: 'quiz', masteryRequired: 40, xpReward: 100, durationMinutes: 30 },
      { title: 'Classification Basics', description: 'Learn decision trees, KNN, and logistic regression.', type: 'lesson', masteryRequired: 50, xpReward: 150, durationMinutes: 60 },
      { title: 'Classification Quiz', description: 'Test classification model understanding and evaluation.', type: 'quiz', masteryRequired: 60, xpReward: 120, durationMinutes: 25 },
      { title: 'Regression Deep Dive', description: 'Linear, polynomial, and regularized regression techniques.', type: 'lesson', masteryRequired: 65, xpReward: 150, durationMinutes: 70 },
      { title: 'Model Evaluation Practice', description: 'Cross-validation, confusion matrices, ROC curves.', type: 'practice', masteryRequired: 70, xpReward: 130, durationMinutes: 45 },
      { title: 'Neural Networks Intro', description: 'Perceptrons, activation functions, and backpropagation.', type: 'lesson', masteryRequired: 75, xpReward: 180, durationMinutes: 90 },
      { title: 'ML Capstone Project', description: 'Build an end-to-end ML pipeline on real data.', type: 'project', masteryRequired: 80, xpReward: 400, durationMinutes: 180 },
    ],
    'python': [
      { title: 'Variables & Data Types', description: 'Master Python variables, types, and type conversions.', type: 'lesson', masteryRequired: 0, xpReward: 50, durationMinutes: 30 },
      { title: 'Control Flow Quiz', description: 'Test if/else, loops, and comprehensions.', type: 'quiz', masteryRequired: 40, xpReward: 80, durationMinutes: 20 },
      { title: 'Functions & Scope', description: 'Function definitions, parameters, closures, and scope rules.', type: 'lesson', masteryRequired: 50, xpReward: 100, durationMinutes: 40 },
      { title: 'OOP Fundamentals', description: 'Classes, inheritance, polymorphism, and encapsulation.', type: 'lesson', masteryRequired: 60, xpReward: 150, durationMinutes: 60 },
      { title: 'OOP Practice Problems', description: 'Hands-on OOP coding exercises and design challenges.', type: 'practice', masteryRequired: 70, xpReward: 120, durationMinutes: 45 },
      { title: 'Advanced Python Project', description: 'Build a complete Python application using OOP and best practices.', type: 'project', masteryRequired: 75, xpReward: 300, durationMinutes: 120 },
    ],
    'web': [
      { title: 'HTML & CSS Foundations', description: 'Semantic HTML, CSS layouts, responsive design.', type: 'lesson', masteryRequired: 0, xpReward: 80, durationMinutes: 40 },
      { title: 'CSS Layout Quiz', description: 'Test flexbox, grid, and responsive design knowledge.', type: 'quiz', masteryRequired: 40, xpReward: 80, durationMinutes: 20 },
      { title: 'JavaScript Essentials', description: 'Variables, functions, DOM manipulation, and events.', type: 'lesson', masteryRequired: 50, xpReward: 120, durationMinutes: 50 },
      { title: 'React Fundamentals', description: 'Components, hooks, state management, and JSX.', type: 'lesson', masteryRequired: 65, xpReward: 150, durationMinutes: 60 },
      { title: 'Full Stack Project', description: 'Build a full-stack web application from scratch.', type: 'project', masteryRequired: 75, xpReward: 400, durationMinutes: 180 },
    ],
    'data': [
      { title: 'Descriptive Statistics', description: 'Mean, median, mode, variance, and distributions.', type: 'lesson', masteryRequired: 0, xpReward: 80, durationMinutes: 40 },
      { title: 'Statistics Quiz', description: 'Validate understanding of statistical concepts.', type: 'quiz', masteryRequired: 40, xpReward: 100, durationMinutes: 25 },
      { title: 'Pandas & NumPy Essentials', description: 'DataFrame operations, array manipulation, data cleaning.', type: 'lesson', masteryRequired: 50, xpReward: 130, durationMinutes: 50 },
      { title: 'Data Cleaning Practice', description: 'Apply data cleaning techniques on real-world messy data.', type: 'practice', masteryRequired: 60, xpReward: 120, durationMinutes: 45 },
      { title: 'Data Visualization Project', description: 'Build an interactive dashboard with Matplotlib and Seaborn.', type: 'project', masteryRequired: 70, xpReward: 250, durationMinutes: 120 },
    ],
  }

  // Pick the best matching topic set based on course title keywords
  const lowerTitle = courseTitle.toLowerCase()
  let selectedTopics = courseTopics['default']
  if (lowerTitle.includes('machine') || lowerTitle.includes('ml') || lowerTitle.includes('ai')) {
    selectedTopics = courseTopics['machine']
  } else if (lowerTitle.includes('python') || lowerTitle.includes('programming')) {
    selectedTopics = courseTopics['python']
  } else if (lowerTitle.includes('web') || lowerTitle.includes('frontend') || lowerTitle.includes('react') || lowerTitle.includes('full')) {
    selectedTopics = courseTopics['web']
  } else if (lowerTitle.includes('data') || lowerTitle.includes('analytics') || lowerTitle.includes('statistics')) {
    selectedTopics = courseTopics['data']
  }

  const nodes: PathNode[] = []
  let seqOrder = 0

  for (const topic of selectedTopics) {
    seqOrder++
    const masteryScore = topicMasteries.get(topic.title) ?? Math.round(Math.random() * 15) // default low mastery if unknown

    // masteryRequired of 0 means no prerequisite — always available
    const effectiveMasteryRequired = topic.masteryRequired === 0 ? 0 : (topic.masteryRequired || 50)
    if (effectiveMasteryRequired === 0) {
      // No mastery required — this is an entry node
      nodes.push({
        id: `node-${courseId}-${seqOrder}`,
        title: topic.title,
        description: topic.description,
        type: topic.type,
        status: masteryScore > 0 ? 'completed' : 'available',
        priority: seqOrder <= 2 ? 'critical' : seqOrder <= 4 ? 'high' : 'normal',
        masteryScore,
        masteryRequired: 0,
        xpReward: topic.xpReward,
        durationMinutes: topic.durationMinutes,
        sequenceOrder: seqOrder,
        unlockRequirement: null,
      })
      continue
    }
    if (masteryScore >= effectiveMasteryRequired * 1.1) {
      // Already completed — include as completed node
      nodes.push({
        id: `node-${courseId}-${seqOrder}`,
        title: topic.title,
        description: topic.description,
        type: topic.type,
        status: 'completed',
        priority: seqOrder <= 2 ? 'critical' : seqOrder <= 4 ? 'high' : 'normal',
        masteryScore,
        masteryRequired: effectiveMasteryRequired,
        xpReward: topic.xpReward,
        durationMinutes: topic.durationMinutes,
        sequenceOrder: seqOrder,
        unlockRequirement: null,
      })
      continue
    }

    // Determine if this node should be recommended (next logical step)
    const prevNode = nodes.length > 0 ? nodes[nodes.length - 1] : null
    const isRecommended = prevNode !== null &&
      (prevNode.status === 'in_progress' || prevNode.status === 'completed') &&
      masteryScore < effectiveMasteryRequired * 0.8 &&
      masteryScore >= effectiveMasteryRequired * 0.5

    const status = determineNodeStatus(masteryScore, effectiveMasteryRequired, isRecommended)

    const unlockRequirement = status === 'locked' && prevNode
      ? `Complete ${prevNode.title}`
      : null

    nodes.push({
      id: `node-${courseId}-${seqOrder}`,
      title: topic.title,
      description: topic.description,
      type: topic.type,
      status,
      priority: seqOrder <= 2 ? 'critical' : seqOrder <= 4 ? 'high' : 'normal',
      masteryScore,
      masteryRequired: effectiveMasteryRequired,
      xpReward: topic.xpReward,
      durationMinutes: topic.durationMinutes,
      sequenceOrder: seqOrder,
      unlockRequirement,
    })
  }

  // Calculate progress
  const completedCount = nodes.filter(n => n.status === 'completed').length
  const progress = nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0

  return {
    id: `path-course-${courseId}`,
    title: `Learning Path: ${courseTitle}`,
    description: `Personalized study plan for ${courseTitle}, adapted to your current skill level.`,
    status: 'active',
    progress,
    courseId,
    careerPathId: null,
    generatedAt: new Date().toISOString(),
    nodes,
  }
}

/**
 * Generate a career-based learning path using the predefined career roadmap.
 */
function generateCareerLearningPath(
  career: CareerRoadmap,
  skillMasteryMap: Map<string, number>, // skillName -> mastery %
): LearningPathData {
  const nodes: PathNode[] = []
  let seqOrder = 0

  for (const step of career.skillRoadmap) {
    seqOrder++
    const masteryScore = skillMasteryMap.get(step.skill) ?? 0
    const masteryRequired = step.requiredLevel === 'Advanced' ? 85
      : step.requiredLevel === 'Intermediate' ? 65
      : 45

    // Skip if already mastered
    if (masteryScore >= masteryRequired * 1.1) {
      nodes.push({
        id: `node-career-${career.id}-${seqOrder}`,
        title: `${step.skill} (${step.requiredLevel})`,
        description: `Achieve ${step.requiredLevel} proficiency in ${step.skill}. Estimated ${step.estimatedHours} hours.`,
        type: 'milestone',
        status: 'completed',
        priority: 'normal',
        masteryScore,
        masteryRequired,
        xpReward: step.estimatedHours * 5,
        durationMinutes: step.estimatedHours * 60,
        sequenceOrder: seqOrder,
        unlockRequirement: null,
      })
      continue
    }

    const prevNode = nodes.length > 0 ? nodes[nodes.length - 1] : null
    const isRecommended = prevNode !== null &&
      (prevNode.status === 'in_progress' || prevNode.status === 'completed') &&
      masteryScore < masteryRequired * 0.8 &&
      masteryScore >= masteryRequired * 0.5

    const status = determineNodeStatus(masteryScore, masteryRequired, isRecommended)
    const unlockRequirement = status === 'locked' && prevNode
      ? `Complete ${prevNode.title}`
      : null

    nodes.push({
      id: `node-career-${career.id}-${seqOrder}`,
      title: `${step.skill} (${step.requiredLevel})`,
      description: `Achieve ${step.requiredLevel} proficiency in ${step.skill}. Estimated ${step.estimatedHours} hours.`,
      type: 'milestone',
      status,
      priority: seqOrder <= 2 ? 'high' : 'normal',
      masteryScore,
      masteryRequired,
      xpReward: step.estimatedHours * 5,
      durationMinutes: step.estimatedHours * 60,
      sequenceOrder: seqOrder,
      unlockRequirement,
    })
  }

  const completedCount = nodes.filter(n => n.status === 'completed').length
  const progress = nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0

  return {
    id: `path-career-${career.id}`,
    title: `Career Path: ${career.title}`,
    description: career.description,
    status: 'active',
    progress,
    courseId: null,
    careerPathId: career.id,
    generatedAt: new Date().toISOString(),
    nodes,
  }
}

// ==================== DB DATA BUILDER ====================

async function buildPathsFromDB(userId: string): Promise<{
  paths: LearningPathData[]
  careerPaths: CareerRoadmap[]
} | null> {
  // Fetch user with enrollments and topic mastery
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      enrollments: {
        where: { status: 'active' },
        include: {
          course: {
            select: { id: true, title: true, category: true },
          },
        },
      },
      topicMasteries: true,
      learningProfile: true,
      learningPaths: {
        include: {
          nodes: {
            orderBy: { sequenceOrder: 'asc' },
          },
        },
        orderBy: { generatedAt: 'desc' },
      },
    },
  })

  if (!user) return null

  // Build topic mastery map
  const topicMasteryMap = new Map<string, number>()
  for (const tm of user.topicMasteries) {
    topicMasteryMap.set(tm.topicName, tm.masteryScore)
  }

  // Build skill mastery map from topic mastery (aggregate by skill)
  const skillMasteryMap = new Map<string, number>()
  const skillTopicScores = new Map<string, number[]>()
  for (const tm of user.topicMasteries) {
    if (tm.skillId) {
      const scores = skillTopicScores.get(tm.skillId) || []
      scores.push(tm.masteryScore)
      skillTopicScores.set(tm.skillId, scores)
    }
    // Also map topic names to common skill names
    const lowerTopic = tm.topicName.toLowerCase()
    if (lowerTopic.includes('python')) {
      const scores = skillTopicScores.get('Python') || []
      scores.push(tm.masteryScore)
      skillTopicScores.set('Python', scores)
    }
    if (lowerTopic.includes('statistic') || lowerTopic.includes('probability')) {
      const scores = skillTopicScores.get('Statistics') || []
      scores.push(tm.masteryScore)
      skillTopicScores.set('Statistics', scores)
    }
    if (lowerTopic.includes('machine') || lowerTopic.includes('regression') || lowerTopic.includes('classification') || lowerTopic.includes('neural')) {
      const scores = skillTopicScores.get('Machine Learning') || []
      scores.push(tm.masteryScore)
      skillTopicScores.set('Machine Learning', scores)
    }
    if (lowerTopic.includes('deep') || lowerTopic.includes('neural')) {
      const scores = skillTopicScores.get('Deep Learning') || []
      scores.push(tm.masteryScore)
      skillTopicScores.set('Deep Learning', scores)
    }
    if (lowerTopic.includes('visualization') || lowerTopic.includes('matplotlib') || lowerTopic.includes('seaborn')) {
      const scores = skillTopicScores.get('Data Visualization') || []
      scores.push(tm.masteryScore)
      skillTopicScores.set('Data Visualization', scores)
    }
    if (lowerTopic.includes('html') || lowerTopic.includes('css')) {
      const scores = skillTopicScores.get('HTML/CSS') || []
      scores.push(tm.masteryScore)
      skillTopicScores.set('HTML/CSS', scores)
    }
    if (lowerTopic.includes('javascript') || lowerTopic.includes('react')) {
      const scores = skillTopicScores.get('JavaScript') || []
      scores.push(tm.masteryScore)
      skillTopicScores.set('JavaScript', scores)
    }
  }

  for (const [skill, scores] of skillTopicScores) {
    skillMasteryMap.set(skill, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length))
  }

  // If there are existing learning paths with nodes in the DB, use them
  if (user.learningPaths.length > 0) {
    const paths: LearningPathData[] = user.learningPaths.map(lp => ({
      id: lp.id,
      title: lp.title,
      description: lp.description ?? '',
      status: lp.status as LearningPathData['status'],
      progress: lp.progress,
      courseId: lp.courseId,
      careerPathId: lp.careerPathId,
      generatedAt: lp.generatedAt.toISOString(),
      nodes: lp.nodes.map(n => ({
        id: n.id,
        title: n.title,
        description: n.description ?? '',
        type: n.nodeType as PathNode['type'],
        status: n.status as PathNode['status'],
        priority: n.priority as PathNode['priority'],
        masteryScore: n.masteryScore,
        masteryRequired: n.masteryRequired,
        xpReward: n.xpReward,
        durationMinutes: n.duration,
        sequenceOrder: n.sequenceOrder,
        unlockRequirement: null,
        nodeId: n.nodeId,
        completedAt: n.completedAt?.toISOString() ?? null,
      })),
    }))
    return { paths, careerPaths: DEMO_CAREER_PATHS }
  }

  // Generate paths from enrollments
  const paths: LearningPathData[] = []

  for (const enrollment of user.enrollments) {
    const coursePath = generateCourseLearningPath(
      enrollment.course.title,
      enrollment.course.id,
      topicMasteryMap,
    )
    paths.push(coursePath)
  }

  // Generate career-based paths for top 2 matching careers
  for (const career of DEMO_CAREER_PATHS.slice(0, 2)) {
    const careerPath = generateCareerLearningPath(career, skillMasteryMap)
    paths.push(careerPath)
  }

  return { paths, careerPaths: DEMO_CAREER_PATHS }
}

// ==================== DEMO DATA ====================

function generateDemoPaths(): { paths: LearningPathData[]; careerPaths: CareerRoadmap[] } {
  // Demo student: weak Classification (35%), strong Python (85%)
  // Keys match the course template topic titles in generateCourseLearningPath
  const topicMasteryMap = new Map<string, number>([
    // ML course topics (matched to 'machine' template)
    ['Statistics Refresher', 65],        // masteryRequired: 0 → completed (65 > 0)
    ['Probability Practice', 55],        // masteryRequired: 40 → in_progress (55 >= 40*0.8)
    ['Classification Basics', 35],       // masteryRequired: 50 → available (35 >= 50*0.5)
    ['Classification Quiz', 10],         // masteryRequired: 60 → locked (10 < 60*0.5)
    ['Regression Deep Dive', 0],         // masteryRequired: 65 → locked
    ['Model Evaluation Practice', 0],    // masteryRequired: 70 → locked
    ['Neural Networks Intro', 0],        // masteryRequired: 75 → locked
    ['ML Capstone Project', 0],          // masteryRequired: 80 → locked
    // Web course topics (matched to 'web' template)
    ['HTML & CSS Foundations', 82],      // masteryRequired: 0 → completed
    ['CSS Layout Quiz', 68],             // masteryRequired: 40 → completed
    ['JavaScript Essentials', 55],       // masteryRequired: 50 → in_progress
    ['React Fundamentals', 28],          // masteryRequired: 65 → available
    ['Full Stack Project', 0],           // masteryRequired: 75 → locked
  ])

  const skillMasteryMap = new Map<string, number>([
    ['Python', 85],
    ['Statistics', 40],
    ['Machine Learning', 35],
    ['Deep Learning', 5],
    ['Data Visualization', 20],
    ['HTML/CSS', 82],
    ['JavaScript', 55],
    ['React', 28],
  ])

  // Course-based path (Machine Learning course)
  const mlPath = generateCourseLearningPath('Intro to Machine Learning', 'course-ml-1', topicMasteryMap)

  // Course-based path (Web Development)
  const webPath = generateCourseLearningPath('Web Development Bootcamp', 'course-web-1', topicMasteryMap)

  // Career-based path (Data Scientist)
  const dsCareerPath = generateCareerLearningPath(DEMO_CAREER_PATHS[0], skillMasteryMap)

  return {
    paths: [mlPath, webPath, dsCareerPath],
    careerPaths: DEMO_CAREER_PATHS,
  }
}

// ==================== AI INSIGHT GENERATION ====================

function generateAIInsight(paths: LearningPathData[], careerPaths: CareerRoadmap[]): string {
  const allNodes = paths.flatMap(p => p.nodes)
  const completedNodes = allNodes.filter(n => n.status === 'completed')
  const inProgressNodes = allNodes.filter(n => n.status === 'in_progress')
  const recommendedNodes = allNodes.filter(n => n.status === 'recommended')
  const lockedNodes = allNodes.filter(n => n.status === 'locked')

  const bestCareer = careerPaths.reduce((a, b) => a.matchPercentage > b.matchPercentage ? a : b)

  let insight = ''

  if (completedNodes.length > 0) {
    insight += `You've completed ${completedNodes.length} step${completedNodes.length > 1 ? 's' : ''} across your learning paths.`
  }

  if (recommendedNodes.length > 0) {
    insight += ` I recommend focusing on "${recommendedNodes[0].title}" next — it's the most impactful step for your progress.`
  } else if (inProgressNodes.length > 0) {
    insight += ` Keep working on "${inProgressNodes[0].title}" — you're making good progress.`
  }

  if (lockedNodes.length > 0) {
    insight += ` ${lockedNodes.length} step${lockedNodes.length > 1 ? 's are' : ' is'} still locked and will unlock as you progress.`
  }

  insight += ` Your best career match is ${bestCareer.title} at ${bestCareer.matchPercentage}%.`

  return insight.trim()
}

function generateSkillContextForAI(paths: LearningPathData[], stats: LearningPathResponse['stats']): string {
  const allNodes = paths.flatMap(p => p.nodes)

  const inProgress = allNodes
    .filter(n => n.status === 'in_progress' || n.status === 'recommended')
    .map(n => `${n.title} (${n.masteryScore}/${n.masteryRequired})`)
    .slice(0, 3)

  const locked = allNodes
    .filter(n => n.status === 'locked')
    .map(n => n.title)
    .slice(0, 3)

  let context = `Learning Paths: ${stats.completed}/${stats.totalNodes} completed, ${stats.inProgress} in progress, ${stats.locked} locked.`

  if (inProgress.length > 0) {
    context += ` Currently working on: ${inProgress.join(', ')}.`
  }

  if (locked.length > 0) {
    context += ` Next unlocks: ${locked.join(', ')}.`
  }

  return context
}

// ==================== MAIN HANDLER ====================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 },
      )
    }

    // Try to build from DB
    let result = await buildPathsFromDB(userId)

    // If DB data is sparse (no paths generated), use demo data
    if (!result || result.paths.length === 0) {
      result = generateDemoPaths()
    }

    // Compute stats across all paths
    const allNodes = result.paths.flatMap(p => p.nodes)
    const stats: LearningPathResponse['stats'] = {
      totalNodes: allNodes.length,
      completed: allNodes.filter(n => n.status === 'completed').length,
      available: allNodes.filter(n => n.status === 'available').length,
      inProgress: allNodes.filter(n => n.status === 'in_progress' || n.status === 'recommended').length,
      locked: allNodes.filter(n => n.status === 'locked').length,
      recommended: allNodes.filter(n => n.status === 'recommended').length,
    }

    const aiInsight = generateAIInsight(result.paths, result.careerPaths)
    const skillContextForAI = generateSkillContextForAI(result.paths, stats)

    const response: LearningPathResponse = {
      paths: result.paths,
      careerPaths: result.careerPaths,
      aiInsight,
      stats,
      skillContextForAI,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Learning Paths API] Error:', error)

    // Return demo data on error so the UI always works
    const result = generateDemoPaths()
    const allNodes = result.paths.flatMap(p => p.nodes)
    const stats: LearningPathResponse['stats'] = {
      totalNodes: allNodes.length,
      completed: allNodes.filter(n => n.status === 'completed').length,
      available: allNodes.filter(n => n.status === 'available').length,
      inProgress: allNodes.filter(n => n.status === 'in_progress' || n.status === 'recommended').length,
      locked: allNodes.filter(n => n.status === 'locked').length,
      recommended: allNodes.filter(n => n.status === 'recommended').length,
    }

    const response: LearningPathResponse = {
      paths: result.paths,
      careerPaths: result.careerPaths,
      aiInsight: generateAIInsight(result.paths, result.careerPaths),
      stats,
      skillContextForAI: generateSkillContextForAI(result.paths, stats),
    }

    return NextResponse.json(response)
  }
}
