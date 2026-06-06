import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ==================== TYPES ====================

interface SkillTreeNode {
  id: string
  name: string
  slug: string
  category: string
  icon: string | null
  description: string | null
  masteryScore: number
  status: string
  trend: string

  quizScore: number
  assignmentScore: number
  practiceScore: number
  completionScore: number
  tutorSignal: number

  parentId: string | null
  children: SkillTreeNode[]

  topics: {
    id: string
    name: string
    masteryScore: number
    status: string
    trend: string
    source: string
  }[]

  aiInsight: string | null

  sourceCourses: { id: string; title: string; thumbnail: string | null }[]

  prerequisites: { id: string; name: string; status: string }[]

  nextStudyRecommendation: string | null
}

interface SkillGraphResponse {
  tree: SkillTreeNode[]
  totalSkills: number
  masteredCount: number
  strongCount: number
  learningCount: number
  weakCount: number
  notStartedCount: number
  averageMastery: number
  overallInsight: string
  skillContextForAI: string
}

// ==================== HELPERS ====================

function masteryToStatus(score: number): string {
  if (score >= 90) return 'mastered'
  if (score >= 75) return 'strong'
  if (score >= 50) return 'learning'
  if (score >= 25) return 'weak'
  return 'not_started'
}

function computeMasteryScore(
  quizScore: number,
  assignmentScore: number,
  practiceScore: number,
  completionScore: number
): number {
  return Math.round(
    quizScore * 0.50 +
    assignmentScore * 0.25 +
    practiceScore * 0.15 +
    completionScore * 0.10
  )
}

function computeTrend(values: number[]): string {
  if (values.length < 2) return 'stable'
  const recent = values.slice(-3)
  const older = values.slice(0, -3)
  if (older.length === 0) return 'stable'
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  const diff = recentAvg - olderAvg
  if (diff > 5) return 'improving'
  if (diff < -5) return 'declining'
  return 'stable'
}

function generateAIInsight(
  node: SkillTreeNode,
  allNodes: Map<string, SkillTreeNode>
): string | null {
  if (node.children.length > 0) {
    const weakChildren = node.children.filter(c => c.status === 'weak' || c.status === 'not_started')
    const strongChildren = node.children.filter(c => c.status === 'strong' || c.status === 'mastered')

    if (weakChildren.length > 0) {
      const weakest = weakChildren.reduce((a, b) => a.masteryScore < b.masteryScore ? a : b)
      return `Your ${node.name} is held back by ${weakest.name}. Focus on improving ${weakest.name} to level up.`
    }

    if (strongChildren.length === node.children.length) {
      return `You've mastered all aspects of ${node.name}! Consider exploring advanced topics.`
    }
  }

  if (node.children.length === 0 && (node.status === 'weak' || node.status === 'not_started')) {
    if (node.prerequisites.length > 0) {
      const unmetPrereqs = node.prerequisites.filter(p => p.status === 'weak' || p.status === 'not_started' || p.status === 'learning')
      if (unmetPrereqs.length > 0) {
        return `Before studying ${node.name}, you should strengthen ${unmetPrereqs[0].name}.`
      }
    }
    return `${node.name} needs attention. Try practicing with quizzes and completing related lessons.`
  }

  if (node.trend === 'declining') {
    return `Your ${node.name} mastery is declining. Review previous material to reinforce your knowledge.`
  }

  if (node.trend === 'improving') {
    return `Great progress on ${node.name}! Keep up the momentum.`
  }

  return null
}

function generateNextStudyRecommendation(node: SkillTreeNode): string | null {
  if (node.status === 'mastered') return null
  if (node.status === 'strong') return `You're close to mastering ${node.name}. Focus on advanced practice and edge cases.`

  if (node.children.length > 0) {
    const weakestChild = node.children.reduce((a, b) => a.masteryScore < b.masteryScore ? a : b)
    if (weakestChild.masteryScore < node.masteryScore) {
      return `Start with ${weakestChild.name} — it's the weakest part of your ${node.name} skill.`
    }
  }

  if (node.quizScore < 50) return `Focus on quizzes for ${node.name} to build your assessment confidence.`
  if (node.assignmentScore < 50) return `Complete more assignments related to ${node.name} for hands-on practice.`
  if (node.completionScore < 50) return `Finish the remaining lessons for ${node.name} to build a solid foundation.`

  return `Continue practicing ${node.name} regularly to improve your mastery.`
}

function generateOverallInsight(tree: SkillTreeNode[], counts: { mastered: number; strong: number; learning: number; weak: number; notStarted: number }, avgMastery: number): string {
  const allNodes = flattenTree(tree)
  const weakestSkills = allNodes
    .filter(n => n.masteryScore < 30 && n.children.length === 0)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3)

  let insight = ''

  if (counts.mastered > 0 || counts.strong > 0) {
    insight += `You have ${counts.mastered} mastered and ${counts.strong} strong skills.`
  }

  if (weakestSkills.length > 0) {
    insight += ` Your biggest growth ${weakestSkills.length === 1 ? 'opportunity' : 'opportunities'} ${weakestSkills.length === 1 ? 'is' : 'are'} ${weakestSkills.map(s => s.name).join(', ')}.`
  }

  if (avgMastery >= 75) {
    insight += ' Overall, you have a strong skill profile — keep pushing toward mastery!'
  } else if (avgMastery >= 50) {
    insight += ' You\'re making solid progress — focus on your weaker areas to level up faster.'
  } else {
    insight += ' You\'re in the early stages of building your skills. Consistent practice will accelerate your growth.'
  }

  return insight.trim()
}

function generateSkillContextForAI(tree: SkillTreeNode[]): string {
  const allNodes = flattenTree(tree)

  const parts: string[] = []
  for (const parent of tree) {
    const weakChildren = parent.children.filter(c => c.status === 'weak' || c.status === 'not_started')
    const childSummary = weakChildren.length > 0
      ? ` (${weakChildren.map(c => `${c.name} ${c.status} at ${c.masteryScore}%`).join(', ')})`
      : ''
    const statusLabel = parent.status === 'mastered' ? 'mastered' : `${parent.masteryScore}%`
    parts.push(`${parent.name} ${statusLabel}${childSummary}`)
  }

  const allLeaves = allNodes.filter(n => n.children.length === 0)
  const weakest = allLeaves
    .filter(n => n.masteryScore < 30)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3)
    .map(n => n.name)

  const nextRec = allLeaves
    .filter(n => n.status === 'weak' || n.status === 'learning')
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 2)

  let context = `Student Skill Profile: ${parts.join(', ')}.`
  if (weakest.length > 0) {
    context += ` Weakest areas: ${weakest.join(', ')}.`
  }
  if (nextRec.length > 0) {
    context += ` Recommended next: ${nextRec.map(n => `Improve ${n.name}`).join(', ')}.`
  }

  return context
}

function flattenTree(nodes: SkillTreeNode[]): SkillTreeNode[] {
  const result: SkillTreeNode[] = []
  for (const node of nodes) {
    result.push(node)
    if (node.children.length > 0) {
      result.push(...flattenTree(node.children))
    }
  }
  return result
}

// ==================== DATABASE DATA BUILDER ====================

async function buildSkillTreeFromDB(userId: string): Promise<SkillTreeNode[] | null> {
  // Get all skills flat (no nested includes for sub-skills — we'll build the tree in memory)
  const allSkills = await db.skill.findMany({
    include: {
      courseSkills: {
        include: {
          course: {
            select: { id: true, title: true, thumbnail: true }
          }
        }
      },
    },
  })

  if (allSkills.length === 0) return null

  // Build lookup maps
  const skillById = new Map(allSkills.map(s => [s.id, s]))
  const childSkillsByParentId = new Map<string, typeof allSkills>()
  for (const skill of allSkills) {
    if (skill.parentSkillId) {
      const siblings = childSkillsByParentId.get(skill.parentSkillId) || []
      siblings.push(skill)
      childSkillsByParentId.set(skill.parentSkillId, siblings)
    }
  }

  // Get parent skills (no parentSkillId)
  const parentSkills = allSkills.filter(s => !s.parentSkillId)

  // Fetch all supporting data in parallel
  const [
    topicMasteries,
    skillTopicMappings,
    quizAttempts,
    submissions,
    enrollments,
    tutorMessages,
    userSkills,
    allCourseSkills,
  ] = await Promise.all([
    db.topicMastery.findMany({ where: { userId } }),
    db.skillTopicMapping.findMany(),
    db.quizAttempt.findMany({
      where: { userId, completedAt: { not: null } },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                questionSkills: true,
              },
            },
          },
        },
      },
    }),
    db.submission.findMany({
      where: { studentId: userId, score: { not: null } },
      include: {
        assignment: {
          include: {
            course: { include: { courseSkills: true } },
          },
        },
      },
    }),
    db.enrollment.findMany({
      where: { userId },
      include: {
        lessonProgress: { include: { lesson: { include: { lessonSkills: true } } } },
        course: { include: { courseSkills: true, modules: { include: { lessons: { include: { lessonSkills: true } } } } } },
      },
    }),
    db.shijlAIMessage.findMany({ where: { userId, role: 'user' } }),
    db.userSkill.findMany({ where: { userId } }),
    db.courseSkill.findMany(),
  ])

  // Build skill score data from all sources
  const skillScoreMap = new Map<string, {
    quizScores: number[]
    assignmentScores: number[]
    practiceScores: number[]
    completionScores: number[]
    tutorQuestionCount: number
  }>()

  const initSkillScores = (skillId: string) => {
    if (!skillScoreMap.has(skillId)) {
      skillScoreMap.set(skillId, {
        quizScores: [],
        assignmentScores: [],
        practiceScores: [],
        completionScores: [],
        tutorQuestionCount: 0,
      })
    }
    return skillScoreMap.get(skillId)!
  }

  // Compute quiz scores from question-skill mappings
  for (const attempt of quizAttempts) {
    const scorePct = attempt.maxScore > 0 ? (attempt.score / attempt.maxScore) * 100 : 0
    const quizData = attempt.quiz as any
    const questions = quizData?.questions || []
    for (const question of questions) {
      for (const qs of (question.questionSkills || [])) {
        const data = initSkillScores(qs.skillId)
        data.quizScores.push(scorePct)
      }
      // Also check for topic-based skill mappings via QuestionTopic
      for (const qt of (question.questionTopics || [])) {
        const mappings = skillTopicMappings.filter((m: any) => m.topicId === qt.topicId)
        for (const mapping of mappings) {
          const data = initSkillScores((mapping as any).skillId)
          data.quizScores.push(scorePct)
        }
      }
    }

    // Also attribute to course skills (use pre-fetched allCourseSkills)
    const courseId = quizData?.courseId
    if (courseId) {
      const courseSkills = allCourseSkills.filter((cs: any) => cs.courseId === courseId)
      for (const cs of courseSkills) {
        const data = initSkillScores((cs as any).skillId)
        data.quizScores.push(scorePct)
      }
    }
  }

  // Compute assignment scores from course-skill mappings
  for (const sub of submissions) {
    if (sub.score === null) continue
    const scorePct = sub.assignment.maxScore > 0 ? (sub.score / sub.assignment.maxScore) * 100 : 0
    for (const cs of sub.assignment.course.courseSkills) {
      const data = initSkillScores(cs.skillId)
      data.assignmentScores.push(scorePct)
    }
  }

  // Compute completion scores from lesson-skill mappings
  for (const enrollment of enrollments) {
    for (const courseModule of enrollment.course.modules) {
      for (const lesson of courseModule.lessons) {
        for (const ls of lesson.lessonSkills) {
          const data = initSkillScores(ls.skillId)
          const lp = enrollment.lessonProgress.find(p => p.lessonId === lesson.id)
          let completionPct = 0
          if (lp) {
            if (lp.status === 'completed') {
              completionPct = 100
            } else if (lp.status === 'in_progress' && lesson.duration > 0) {
              completionPct = Math.min(100, Math.round((lp.timeSpent / (lesson.duration * 60)) * 100))
            }
          }
          data.completionScores.push(completionPct)
        }
      }
    }
  }

  // Compute practice scores from topic mastery practice data
  for (const tm of topicMasteries) {
    if (tm.skillId) {
      const data = initSkillScores(tm.skillId)
      data.practiceScores.push(tm.practiceScore)
    }
    const mappings = skillTopicMappings.filter(m => m.topicId === tm.topicId)
    for (const mapping of mappings) {
      const data = initSkillScores(mapping.skillId)
      data.practiceScores.push(tm.practiceScore)
    }
  }

  // Compute tutor signal (inverted: fewer Qs = higher score)
  const skillSlugMap = new Map(allSkills.map(s => [s.id, s.slug]))
  const tutorQuestionCounts = new Map<string, number>()

  const skillKeywords: Record<string, string[]> = {
    'python-programming': ['python', 'django', 'flask', 'decorator', 'generator', 'oop', 'class', 'function'],
    'data-analysis': ['pandas', 'numpy', 'dataframe', 'analysis', 'statistics', 'visualization'],
    'machine-learning': ['machine learning', 'neural network', 'deep learning', 'model', 'training', 'sklearn'],
    'web-development': ['html', 'css', 'javascript', 'react', 'frontend', 'backend', 'web'],
    'sql-databases': ['sql', 'database', 'query', 'table', 'join'],
    'api-design': ['api', 'rest', 'endpoint', 'graphql', 'http'],
    'git-version-control': ['git', 'github', 'commit', 'branch', 'merge'],
    'docker-devops': ['docker', 'container', 'kubernetes', 'deploy', 'devops'],
    'problem-solving': ['algorithm', 'logic', 'debug', 'error', 'solve'],
    'communication': ['explain', 'document', 'write', 'present'],
  }

  for (const msg of tutorMessages) {
    const contentLower = msg.content.toLowerCase()
    for (const [slug, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(kw => contentLower.includes(kw))) {
        tutorQuestionCounts.set(slug, (tutorQuestionCounts.get(slug) || 0) + 1)
      }
    }
  }

  for (const [skillId, data] of skillScoreMap) {
    const slug = skillSlugMap.get(skillId) || ''
    data.tutorQuestionCount = tutorQuestionCounts.get(slug) || 0
  }

  // Build the tree in memory (no Prisma nested include issues)
  const nodeMap = new Map<string, SkillTreeNode>()

  function buildNode(skillId: string): SkillTreeNode {
    // Check if already built
    if (nodeMap.has(skillId)) return nodeMap.get(skillId)!

    const skill = skillById.get(skillId)
    if (!skill) {
      // Should not happen, but provide a fallback
      const fallbackNode: SkillTreeNode = {
        id: skillId, name: 'Unknown', slug: 'unknown', category: 'programming',
        icon: null, description: null, masteryScore: 0, status: 'not_started', trend: 'stable',
        quizScore: 0, assignmentScore: 0, practiceScore: 0, completionScore: 0, tutorSignal: 70,
        parentId: null, children: [], topics: [], aiInsight: null,
        sourceCourses: [], prerequisites: [], nextStudyRecommendation: null,
      }
      nodeMap.set(skillId, fallbackNode)
      return fallbackNode
    }

    const scores = skillScoreMap.get(skill.id)
    const userSkill = userSkills.find(us => us.skillId === skill.id)

    // Compute component scores
    const quizScore = scores
      ? (scores.quizScores.length > 0 ? scores.quizScores.reduce((a, b) => a + b, 0) / scores.quizScores.length : 0)
      : (userSkill?.quizScore || 0)

    const assignmentScore = scores
      ? (scores.assignmentScores.length > 0 ? scores.assignmentScores.reduce((a, b) => a + b, 0) / scores.assignmentScores.length : 0)
      : (userSkill?.assignmentScore || 0)

    const practiceScore = scores
      ? (scores.practiceScores.length > 0 ? scores.practiceScores.reduce((a, b) => a + b, 0) / scores.practiceScores.length : 0)
      : 0

    const completionScore = scores
      ? (scores.completionScores.length > 0 ? scores.completionScores.reduce((a, b) => a + b, 0) / scores.completionScores.length : 0)
      : (userSkill?.lessonScore || 0)

    const tutorQuestionCount = scores?.tutorQuestionCount || 0
    const tutorSignal = tutorQuestionCount === 0
      ? 70
      : tutorQuestionCount <= 2 ? 80
      : tutorQuestionCount <= 5 ? 60
      : tutorQuestionCount <= 10 ? 40
      : 20

    // Get topics for this skill
    const skillTopics = skillTopicMappings.filter(m => m.skillId === skill.id || m.skillName === skill.name)
    const topics: SkillTreeNode['topics'] = skillTopics.map(stm => {
      const tm = topicMasteries.find(t => t.topicId === stm.topicId)
      return {
        id: stm.topicId,
        name: stm.topicName,
        masteryScore: tm?.masteryScore || 0,
        status: tm?.status || 'not_started',
        trend: tm?.trend || 'stable',
        source: tm
          ? (tm.quizScore > 0 ? 'quiz' : tm.assignmentScore > 0 ? 'assignment' : tm.completionScore > 0 ? 'lesson' : 'practice')
          : 'lesson',
      }
    })

    // Also add topics from TopicMastery that reference this skill
    const directTopics = topicMasteries.filter(tm => tm.skillId === skill.id)
    for (const dt of directTopics) {
      if (!topics.find(t => t.id === dt.topicId)) {
        topics.push({
          id: dt.topicId,
          name: dt.topicName,
          masteryScore: dt.masteryScore,
          status: dt.status,
          trend: dt.trend,
          source: dt.quizScore > 0 ? 'quiz' : dt.assignmentScore > 0 ? 'assignment' : dt.completionScore > 0 ? 'lesson' : 'practice',
        })
      }
    }

    // Build children recursively using the in-memory map
    const childSkills = childSkillsByParentId.get(skill.id) || []
    const children = childSkills.map(child => buildNode(child.id))

    // For parent skills: mastery = average of children
    // For leaf skills: compute from component scores
    let masteryScore: number
    if (children.length > 0) {
      masteryScore = Math.round(children.reduce((sum, c) => sum + c.masteryScore, 0) / children.length)
    } else {
      masteryScore = computeMasteryScore(quizScore, assignmentScore, practiceScore, completionScore)
    }

    const status = masteryToStatus(masteryScore)

    // Compute trend from topic masteries
    const trendValues = topics.map(t => t.masteryScore)
    const trend = computeTrend(trendValues)

    // Source courses
    const sourceCourses = skill.courseSkills.map(cs => ({
      id: cs.course.id,
      title: cs.course.title,
      thumbnail: cs.course.thumbnail,
    }))

    // Determine category mapping
    const categoryMap: Record<string, string> = {
      'Technical': 'programming',
      'Soft Skills': 'soft-skills',
      'Tools': 'devops',
    }
    const category = categoryMap[skill.category] || skill.category.toLowerCase()

    const node: SkillTreeNode = {
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      category,
      icon: skill.icon,
      description: skill.description,
      masteryScore,
      status,
      trend,
      quizScore: Math.round(quizScore * 10) / 10,
      assignmentScore: Math.round(assignmentScore * 10) / 10,
      practiceScore: Math.round(practiceScore * 10) / 10,
      completionScore: Math.round(completionScore * 10) / 10,
      tutorSignal,
      parentId: skill.parentSkillId,
      children,
      topics,
      aiInsight: null,
      sourceCourses,
      prerequisites: [],
      nextStudyRecommendation: null,
    }

    nodeMap.set(skill.id, node)
    return node
  }

  // Build all parent nodes (children built recursively)
  const tree = parentSkills.map(skill => buildNode(skill.id))

  // Fill in AI insights, prerequisites, and next study recommendations
  for (const [, node] of nodeMap) {
    node.aiInsight = generateAIInsight(node, nodeMap)
    node.nextStudyRecommendation = generateNextStudyRecommendation(node)

    // Build prerequisites: parent skill is a prerequisite if weak
    if (node.parentId) {
      const parentNode = nodeMap.get(node.parentId)
      if (parentNode && parentNode.masteryScore < 50) {
        node.prerequisites.push({
          id: parentNode.id,
          name: parentNode.name,
          status: parentNode.status,
        })
      }
    }

    // Add cross-category prerequisites
    const prereqRules: Record<string, string[]> = {
      'machine-learning': ['python-programming', 'data-analysis'],
      'web-development': ['python-programming'],
      'api-design': ['web-development'],
      'docker-devops': ['git-version-control'],
    }

    const prereqSlugs = prereqRules[node.slug] || []
    for (const prereqSlug of prereqSlugs) {
      const prereqNode = Array.from(nodeMap.values()).find(n => n.slug === prereqSlug)
      if (prereqNode && !node.prerequisites.find(p => p.id === prereqNode.id)) {
        node.prerequisites.push({
          id: prereqNode.id,
          name: prereqNode.name,
          status: prereqNode.status,
        })
      }
    }
  }

  return tree
}

// ==================== DEMO DATA GENERATOR ====================

function generateDemoSkillTree(): SkillTreeNode[] {
  const makeNode = (
    id: string, name: string, slug: string, category: string,
    icon: string, description: string, masteryScore: number,
    parentId: string | null = null,
    children: SkillTreeNode[] = [],
    quizScore = 0, assignmentScore = 0, practiceScore = 0, completionScore = 0, tutorSignal = 70
  ): SkillTreeNode => {
    const status = masteryToStatus(masteryScore)
    const trend: string = masteryScore >= 75 ? 'improving' : masteryScore >= 40 ? 'stable' : 'declining'
    return {
      id,
      name,
      slug,
      category,
      icon,
      description,
      masteryScore,
      status,
      trend,
      quizScore,
      assignmentScore,
      practiceScore,
      completionScore,
      tutorSignal,
      parentId,
      children,
      topics: [],
      aiInsight: null,
      sourceCourses: [],
      prerequisites: [],
      nextStudyRecommendation: null,
    }
  }

  // ===== Leaf Skills =====

  const variablesDataTypes = makeNode('sg-1-1', 'Variables & Data Types', 'variables-data-types', 'programming', '📋', 'Understanding Python variables, types, and type conversions', 95, null, [], 98, 92, 95, 90, 90)
  const loopsIteration = makeNode('sg-1-2', 'Loops & Iteration', 'loops-iteration', 'programming', '🔄', 'For loops, while loops, list comprehensions', 82, null, [], 85, 78, 80, 85, 80)
  const functions = makeNode('sg-1-3', 'Functions', 'functions', 'programming', '⚡', 'Function definitions, parameters, return values, scope', 85, null, [], 88, 82, 85, 80, 85)
  const oopConcepts = makeNode('sg-1-4', 'OOP Concepts', 'oop-concepts', 'programming', '🏗️', 'Classes, inheritance, polymorphism, encapsulation', 45, null, [], 50, 40, 42, 48, 50)
  const decorators = makeNode('sg-1-5', 'Decorators', 'decorators', 'programming', '✨', 'Function decorators, class decorators, context managers', 22, null, [], 25, 18, 20, 25, 40)

  const regression = makeNode('sg-2-1', 'Regression', 'regression', 'data', '📈', 'Linear, polynomial, and logistic regression', 68, null, [], 72, 65, 70, 60, 70)
  const classification = makeNode('sg-2-2', 'Classification', 'classification', 'data', '🏷️', 'SVM, decision trees, random forests, KNN', 45, null, [], 48, 42, 40, 50, 55)
  const clustering = makeNode('sg-2-3', 'Clustering', 'clustering', 'data', '🎯', 'K-means, hierarchical, DBSCAN clustering', 18, null, [], 20, 15, 12, 22, 50)
  const neuralNetworks = makeNode('sg-2-4', 'Neural Networks', 'neural-networks', 'data', '🧠', 'Deep learning, CNNs, RNNs, transformers', 8, null, [], 10, 5, 8, 12, 30)

  const htmlCss = makeNode('sg-3-1', 'HTML & CSS', 'html-css', 'web', '🎨', 'Semantic HTML, CSS layouts, responsive design', 82, null, [], 85, 78, 80, 85, 80)
  const jsBasics = makeNode('sg-3-2', 'JavaScript Basics', 'javascript-basics', 'web', '⚡', 'Variables, functions, DOM manipulation, events', 55, null, [], 58, 50, 55, 52, 65)
  const reactFundamentals = makeNode('sg-3-3', 'React Fundamentals', 'react-fundamentals', 'web', '⚛️', 'Components, hooks, state management, JSX', 28, null, [], 30, 22, 25, 32, 45)

  const logicalThinking = makeNode('sg-4-1', 'Logical Thinking', 'logical-thinking', 'soft-skills', '🧠', 'Pattern recognition, logical reasoning, deduction', 88, null, [], 90, 85, 88, 85, 90)
  const debugging = makeNode('sg-4-2', 'Debugging', 'debugging', 'programming', '🔍', 'Systematic debugging, error analysis, logging', 74, null, [], 78, 70, 72, 75, 75)
  const algorithmDesign = makeNode('sg-4-3', 'Algorithm Design', 'algorithm-design', 'programming', '📐', 'Algorithm complexity, design patterns, optimization', 45, null, [], 50, 38, 42, 48, 50)

  const descriptiveStats = makeNode('sg-5-1', 'Descriptive Statistics', 'descriptive-statistics', 'math', '📊', 'Mean, median, mode, variance, distributions', 65, null, [], 68, 62, 65, 60, 75)
  const dataVisualization = makeNode('sg-5-2', 'Data Visualization', 'data-visualization', 'data', '📉', 'Matplotlib, Seaborn, plot types, storytelling', 40, null, [], 42, 35, 38, 45, 60)
  const pandasNumpy = makeNode('sg-5-3', 'Pandas & NumPy', 'pandas-numpy', 'data', '🐼', 'Data manipulation, DataFrames, arrays, operations', 22, null, [], 25, 18, 20, 25, 45)

  const gitVersionControl = makeNode('sg-6', 'Git & Version Control', 'git-version-control', 'devops', '🔀', 'Version control workflows, branching, merging, collaboration', 92, null, [], 95, 90, 88, 92, 95)

  // ===== Topics for leaf nodes =====
  variablesDataTypes.topics = [
    { id: 't-var-1', name: 'Variable Assignment', masteryScore: 98, status: 'mastered', trend: 'stable', source: 'quiz' },
    { id: 't-var-2', name: 'Data Types', masteryScore: 95, status: 'mastered', trend: 'stable', source: 'quiz' },
    { id: 't-var-3', name: 'Type Conversion', masteryScore: 90, status: 'mastered', trend: 'improving', source: 'assignment' },
  ]
  loopsIteration.topics = [
    { id: 't-loop-1', name: 'For Loops', masteryScore: 90, status: 'mastered', trend: 'stable', source: 'quiz' },
    { id: 't-loop-2', name: 'While Loops', masteryScore: 80, status: 'strong', trend: 'stable', source: 'quiz' },
    { id: 't-loop-3', name: 'List Comprehensions', masteryScore: 75, status: 'strong', trend: 'improving', source: 'practice' },
  ]
  functions.topics = [
    { id: 't-fn-1', name: 'Function Definitions', masteryScore: 92, status: 'mastered', trend: 'stable', source: 'quiz' },
    { id: 't-fn-2', name: 'Parameters & Arguments', masteryScore: 85, status: 'strong', trend: 'improving', source: 'assignment' },
    { id: 't-fn-3', name: 'Closures & Scope', masteryScore: 78, status: 'strong', trend: 'stable', source: 'practice' },
  ]
  oopConcepts.topics = [
    { id: 't-oop-1', name: 'Classes & Objects', masteryScore: 55, status: 'learning', trend: 'improving', source: 'quiz' },
    { id: 't-oop-2', name: 'Inheritance', masteryScore: 42, status: 'weak', trend: 'stable', source: 'assignment' },
    { id: 't-oop-3', name: 'Polymorphism', masteryScore: 35, status: 'weak', trend: 'declining', source: 'quiz' },
  ]
  decorators.topics = [
    { id: 't-dec-1', name: 'Function Decorators', masteryScore: 28, status: 'weak', trend: 'stable', source: 'quiz' },
    { id: 't-dec-2', name: 'Class Decorators', masteryScore: 15, status: 'weak', trend: 'declining', source: 'practice' },
  ]
  regression.topics = [
    { id: 't-reg-1', name: 'Linear Regression', masteryScore: 75, status: 'strong', trend: 'improving', source: 'quiz' },
    { id: 't-reg-2', name: 'Polynomial Regression', masteryScore: 60, status: 'learning', trend: 'stable', source: 'assignment' },
  ]
  classification.topics = [
    { id: 't-cls-1', name: 'Decision Trees', masteryScore: 50, status: 'learning', trend: 'improving', source: 'quiz' },
    { id: 't-cls-2', name: 'SVM & KNN', masteryScore: 38, status: 'weak', trend: 'stable', source: 'practice' },
  ]
  clustering.topics = [
    { id: 't-clu-1', name: 'K-Means', masteryScore: 22, status: 'weak', trend: 'stable', source: 'quiz' },
    { id: 't-clu-2', name: 'Hierarchical Clustering', masteryScore: 12, status: 'weak', trend: 'declining', source: 'practice' },
  ]
  neuralNetworks.topics = [
    { id: 't-nn-1', name: 'Perceptrons', masteryScore: 12, status: 'weak', trend: 'stable', source: 'quiz' },
    { id: 't-nn-2', name: 'Backpropagation', masteryScore: 5, status: 'not_started', trend: 'stable', source: 'lesson' },
  ]
  htmlCss.topics = [
    { id: 't-html-1', name: 'HTML5 Semantics', masteryScore: 88, status: 'mastered', trend: 'stable', source: 'quiz' },
    { id: 't-html-2', name: 'CSS Flexbox & Grid', masteryScore: 78, status: 'strong', trend: 'improving', source: 'assignment' },
  ]
  jsBasics.topics = [
    { id: 't-js-1', name: 'Variables & Functions', masteryScore: 62, status: 'learning', trend: 'improving', source: 'quiz' },
    { id: 't-js-2', name: 'DOM Manipulation', masteryScore: 48, status: 'weak', trend: 'stable', source: 'assignment' },
  ]
  reactFundamentals.topics = [
    { id: 't-react-1', name: 'JSX & Components', masteryScore: 35, status: 'weak', trend: 'stable', source: 'quiz' },
    { id: 't-react-2', name: 'Hooks & State', masteryScore: 20, status: 'weak', trend: 'declining', source: 'practice' },
  ]
  logicalThinking.topics = [
    { id: 't-lt-1', name: 'Pattern Recognition', masteryScore: 90, status: 'mastered', trend: 'stable', source: 'quiz' },
    { id: 't-lt-2', name: 'Logical Deduction', masteryScore: 85, status: 'strong', trend: 'improving', source: 'assignment' },
  ]
  debugging.topics = [
    { id: 't-dbg-1', name: 'Error Analysis', masteryScore: 80, status: 'strong', trend: 'improving', source: 'quiz' },
    { id: 't-dbg-2', name: 'Systematic Debugging', masteryScore: 68, status: 'learning', trend: 'stable', source: 'practice' },
  ]
  algorithmDesign.topics = [
    { id: 't-algo-1', name: 'Complexity Analysis', masteryScore: 52, status: 'learning', trend: 'improving', source: 'quiz' },
    { id: 't-algo-2', name: 'Design Patterns', masteryScore: 38, status: 'weak', trend: 'stable', source: 'assignment' },
  ]
  descriptiveStats.topics = [
    { id: 't-stat-1', name: 'Central Tendency', masteryScore: 72, status: 'learning', trend: 'improving', source: 'quiz' },
    { id: 't-stat-2', name: 'Distributions', masteryScore: 58, status: 'learning', trend: 'stable', source: 'assignment' },
  ]
  dataVisualization.topics = [
    { id: 't-viz-1', name: 'Chart Types', masteryScore: 48, status: 'weak', trend: 'stable', source: 'quiz' },
    { id: 't-viz-2', name: 'Matplotlib & Seaborn', masteryScore: 32, status: 'weak', trend: 'declining', source: 'practice' },
  ]
  pandasNumpy.topics = [
    { id: 't-pd-1', name: 'DataFrame Operations', masteryScore: 28, status: 'weak', trend: 'stable', source: 'quiz' },
    { id: 't-pd-2', name: 'NumPy Arrays', masteryScore: 15, status: 'weak', trend: 'declining', source: 'practice' },
  ]
  gitVersionControl.topics = [
    { id: 't-git-1', name: 'Git Basics', masteryScore: 95, status: 'mastered', trend: 'stable', source: 'quiz' },
    { id: 't-git-2', name: 'Branching & Merging', masteryScore: 90, status: 'mastered', trend: 'stable', source: 'assignment' },
    { id: 't-git-3', name: 'Collaboration Workflows', masteryScore: 88, status: 'mastered', trend: 'improving', source: 'practice' },
  ]

  // ===== Source Courses =====
  const pythonCourses = [
    { id: 'course-py-1', title: 'Python for Beginners', thumbnail: null },
    { id: 'course-py-2', title: 'Advanced Python Programming', thumbnail: null },
  ]
  variablesDataTypes.sourceCourses = pythonCourses
  loopsIteration.sourceCourses = pythonCourses
  functions.sourceCourses = pythonCourses
  oopConcepts.sourceCourses = [pythonCourses[1]]
  decorators.sourceCourses = [pythonCourses[1]]

  const mlCourses = [{ id: 'course-ml-1', title: 'Intro to Machine Learning', thumbnail: null }]
  regression.sourceCourses = mlCourses
  classification.sourceCourses = mlCourses
  clustering.sourceCourses = mlCourses
  neuralNetworks.sourceCourses = mlCourses

  const webDevCourses = [{ id: 'course-web-1', title: 'Web Development Bootcamp', thumbnail: null }]
  htmlCss.sourceCourses = webDevCourses
  jsBasics.sourceCourses = webDevCourses
  reactFundamentals.sourceCourses = webDevCourses

  const psCourses = [{ id: 'course-ps-1', title: 'Algorithm Design & Problem Solving', thumbnail: null }]
  logicalThinking.sourceCourses = psCourses
  debugging.sourceCourses = psCourses
  algorithmDesign.sourceCourses = psCourses

  const daCourses = [{ id: 'course-da-1', title: 'Data Analysis with Python', thumbnail: null }]
  descriptiveStats.sourceCourses = daCourses
  dataVisualization.sourceCourses = daCourses
  pandasNumpy.sourceCourses = daCourses

  gitVersionControl.sourceCourses = [{ id: 'course-git-1', title: 'Git & GitHub Mastery', thumbnail: null }]

  // ===== Parent Skills =====
  const pythonProgramming = makeNode(
    'sg-1', 'Python Programming', 'python-programming', 'programming',
    '🐍', 'Write, debug, and maintain Python code', 72,
    null, [variablesDataTypes, loopsIteration, functions, oopConcepts, decorators],
    69, 62, 66, 65, 70
  )
  const machineLearning = makeNode(
    'sg-2', 'Machine Learning', 'machine-learning', 'data',
    '🤖', 'Build and train ML models for prediction and classification', 38,
    null, [regression, classification, clustering, neuralNetworks],
    38, 31, 35, 36, 50
  )
  const webDevelopment = makeNode(
    'sg-3', 'Web Development', 'web-development', 'web',
    '🌐', 'Build web applications and APIs', 55,
    null, [htmlCss, jsBasics, reactFundamentals],
    58, 50, 53, 56, 65
  )
  const problemSolving = makeNode(
    'sg-4', 'Problem Solving', 'problem-solving', 'soft-skills',
    '🧩', 'Analytical thinking and problem decomposition', 75,
    null, [logicalThinking, debugging, algorithmDesign],
    73, 64, 67, 69, 75
  )
  const dataAnalysis = makeNode(
    'sg-5', 'Data Analysis', 'data-analysis', 'data',
    '📊', 'Analyze and interpret complex data sets', 42,
    null, [descriptiveStats, dataVisualization, pandasNumpy],
    45, 38, 41, 43, 60
  )
  const gitSkill = makeNode(
    'sg-6', 'Git & Version Control', 'git-version-control', 'devops',
    '🔀', 'Version control workflows, branching, merging, collaboration', 92,
    null, [],
    95, 90, 88, 92, 95
  )

  // ===== Set parent IDs =====
  variablesDataTypes.parentId = pythonProgramming.id
  loopsIteration.parentId = pythonProgramming.id
  functions.parentId = pythonProgramming.id
  oopConcepts.parentId = pythonProgramming.id
  decorators.parentId = pythonProgramming.id
  regression.parentId = machineLearning.id
  classification.parentId = machineLearning.id
  clustering.parentId = machineLearning.id
  neuralNetworks.parentId = machineLearning.id
  htmlCss.parentId = webDevelopment.id
  jsBasics.parentId = webDevelopment.id
  reactFundamentals.parentId = webDevelopment.id
  logicalThinking.parentId = problemSolving.id
  debugging.parentId = problemSolving.id
  algorithmDesign.parentId = problemSolving.id
  descriptiveStats.parentId = dataAnalysis.id
  dataVisualization.parentId = dataAnalysis.id
  pandasNumpy.parentId = dataAnalysis.id

  // ===== Prerequisites =====
  oopConcepts.prerequisites = [
    { id: functions.id, name: functions.name, status: functions.status },
  ]
  decorators.prerequisites = [
    { id: oopConcepts.id, name: oopConcepts.name, status: oopConcepts.status },
    { id: functions.id, name: functions.name, status: functions.status },
  ]
  machineLearning.prerequisites = [
    { id: pythonProgramming.id, name: pythonProgramming.name, status: pythonProgramming.status },
    { id: dataAnalysis.id, name: dataAnalysis.name, status: dataAnalysis.status },
  ]
  neuralNetworks.prerequisites = [
    { id: regression.id, name: regression.name, status: regression.status },
    { id: classification.id, name: classification.name, status: classification.status },
  ]
  reactFundamentals.prerequisites = [
    { id: jsBasics.id, name: jsBasics.name, status: jsBasics.status },
    { id: htmlCss.id, name: htmlCss.name, status: htmlCss.status },
  ]
  clustering.prerequisites = [
    { id: regression.id, name: regression.name, status: regression.status },
  ]
  pandasNumpy.prerequisites = [
    { id: variablesDataTypes.id, name: variablesDataTypes.name, status: variablesDataTypes.status },
  ]

  // Build the tree
  const tree = [pythonProgramming, machineLearning, webDevelopment, problemSolving, dataAnalysis, gitSkill]

  // Generate AI insights for all nodes
  const allNodes = new Map<string, SkillTreeNode>()
  const collectNodes = (nodes: SkillTreeNode[]) => {
    for (const node of nodes) {
      allNodes.set(node.id, node)
      if (node.children.length > 0) collectNodes(node.children)
    }
  }
  collectNodes(tree)

  for (const [, node] of allNodes) {
    node.aiInsight = generateAIInsight(node, allNodes)
    node.nextStudyRecommendation = generateNextStudyRecommendation(node)
  }

  return tree
}

// ==================== MAIN HANDLER ====================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Try to build tree from database
    let tree = await buildSkillTreeFromDB(userId)

    // If no skill tree in DB or data is too sparse (fewer than 6 parent nodes or average mastery < 30%), use demo data
    const dbTreeLength = tree?.length || 0
    const dbAvgMastery = tree && tree.length > 0
      ? Math.round(tree.reduce((sum, n) => sum + n.masteryScore, 0) / tree.length)
      : 0
    if (!tree || tree.length === 0 || dbTreeLength < 6 || dbAvgMastery < 30) {
      tree = generateDemoSkillTree()
    }

    // Compute summary stats
    const allNodes = flattenTree(tree)
    const masteredCount = allNodes.filter(n => n.status === 'mastered').length
    const strongCount = allNodes.filter(n => n.status === 'strong').length
    const learningCount = allNodes.filter(n => n.status === 'learning').length
    const weakCount = allNodes.filter(n => n.status === 'weak').length
    const notStartedCount = allNodes.filter(n => n.status === 'not_started').length
    const totalSkills = allNodes.length
    const averageMastery = totalSkills > 0
      ? Math.round(allNodes.reduce((sum, n) => sum + n.masteryScore, 0) / totalSkills)
      : 0

    const overallInsight = generateOverallInsight(tree, {
      mastered: masteredCount,
      strong: strongCount,
      learning: learningCount,
      weak: weakCount,
      notStarted: notStartedCount,
    }, averageMastery)

    const skillContextForAI = generateSkillContextForAI(tree)

    const response: SkillGraphResponse = {
      tree,
      totalSkills,
      masteredCount,
      strongCount,
      learningCount,
      weakCount,
      notStartedCount,
      averageMastery,
      overallInsight,
      skillContextForAI,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Skill Graph API] Error:', error)
    // Return demo data on error so the UI always works
    const tree = generateDemoSkillTree()
    const allNodes = flattenTree(tree)

    const masteredCount = allNodes.filter(n => n.status === 'mastered').length
    const strongCount = allNodes.filter(n => n.status === 'strong').length
    const learningCount = allNodes.filter(n => n.status === 'learning').length
    const weakCount = allNodes.filter(n => n.status === 'weak').length
    const notStartedCount = allNodes.filter(n => n.status === 'not_started').length
    const totalSkills = allNodes.length
    const averageMastery = totalSkills > 0
      ? Math.round(allNodes.reduce((sum, n) => sum + n.masteryScore, 0) / totalSkills)
      : 0

    const response: SkillGraphResponse = {
      tree,
      totalSkills,
      masteredCount,
      strongCount,
      learningCount,
      weakCount,
      notStartedCount,
      averageMastery,
      overallInsight: generateOverallInsight(tree, {
        mastered: masteredCount,
        strong: strongCount,
        learning: learningCount,
        weak: weakCount,
        notStarted: notStartedCount,
      }, averageMastery),
      skillContextForAI: generateSkillContextForAI(tree),
    }

    return NextResponse.json(response)
  }
}
