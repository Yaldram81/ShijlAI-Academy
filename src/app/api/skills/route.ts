import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ==================== TYPES ====================

interface SkillRadarItem {
  name: string
  score: number
  target: number
}

interface SubSkill {
  name: string
  score: number
  level: string
}

interface EvidenceItem {
  source: string
  item: string
  contribution: string
  type: 'positive' | 'negative' | 'neutral'
}

interface SkillDetail {
  id: string
  name: string
  slug: string
  category: string
  icon: string | null
  overallScore: number
  level: string
  isVerified: boolean
  verifiedBy: string | null
  isGap: boolean
  isRecommended: boolean
  lessonScore: number
  quizScore: number
  assignmentScore: number
  tutorSignalScore: number
  certBonus: number
  evidenceCount: number
  subSkills: SubSkill[]
  evidence: EvidenceItem[]
  aiInsight: string | null
  sourceCourses: string[]
  careerRelevance: string | null
}

interface SkillHistoryPoint {
  date: string
  score: number
  level: string
  event: string | null
}

interface SkillHistoryEntry {
  skillId: string
  skillName: string
  points: SkillHistoryPoint[]
}

interface CareerPathSkillGap {
  name: string
  requiredLevel: string
  requiredScore: number
  yourScore: number
  gap: 'none' | 'small' | 'medium' | 'large'
}

interface CareerPathItem {
  id: string
  title: string
  slug: string
  description: string | null
  icon: string | null
  readiness: number
  skills: CareerPathSkillGap[]
  aiAdvice: string | null
  recommendedCourses: { title: string; price: number; duration: string }[]
}

interface ComparisonItem {
  skillName: string
  yourScore: number
  avgScore: number
  topTenScore: number
}

interface ChallengeItem {
  id: string
  title: string
  description: string
  xpReward: number
  badge: string | null
  difficulty: number
  status: 'available' | 'completed' | 'locked'
  requiredLevel: string
  progress: number
  bestTime: string | null
  completedAt: string | null
}

interface SkillsApiResponse {
  skillTitle: string
  skillTitleDescription: string
  closestCareerPath: string
  nextLevelSkills: string[]
  totalSkillsTracked: number
  verifiedSkills: number
  inProgressSkills: number
  overallScore: number
  scoreChange: number
  skillRadar: SkillRadarItem[]
  skills: SkillDetail[]
  skillHistory: SkillHistoryEntry[]
  careerPaths: CareerPathItem[]
  comparisons: ComparisonItem[]
  challenges: ChallengeItem[]
}

// ==================== HELPERS ====================

function scoreToLevel(score: number): string {
  if (score <= 20) return 'Awareness'
  if (score <= 40) return 'Beginner'
  if (score <= 60) return 'Elementary'
  if (score <= 75) return 'Intermediate'
  if (score <= 88) return 'Advanced'
  return 'Expert'
}

function levelToMinScore(level: string): number {
  switch (level.toLowerCase()) {
    case 'awareness': return 0
    case 'beginner': return 21
    case 'elementary': return 41
    case 'intermediate': return 61
    case 'advanced': return 76
    case 'expert': return 89
    default: return 0
  }
}

function computeOverallScore(
  lessonScore: number,
  quizScore: number,
  assignmentScore: number,
  tutorSignalScore: number,
  certBonus: number
): number {
  return Math.round(
    lessonScore * 0.20 +
    quizScore * 0.35 +
    assignmentScore * 0.30 +
    tutorSignalScore * 0.10 +
    certBonus * 0.05
  )
}

// ==================== SEEDING ====================

async function ensureSkillsSeeded(userId: string): Promise<void> {
  // Check if skills already exist
  const existingSkills = await db.skill.count()
  if (existingSkills > 0) return

  // Define skills to seed
  const skillDefs = [
    { name: 'Python Programming', slug: 'python-programming', category: 'Technical', icon: '🐍', description: 'Write, debug, and maintain Python code' },
    { name: 'Data Analysis', slug: 'data-analysis', category: 'Technical', icon: '📊', description: 'Analyze and interpret complex data sets' },
    { name: 'Machine Learning', slug: 'machine-learning', category: 'Technical', icon: '🤖', description: 'Build and train ML models' },
    { name: 'Web Development', slug: 'web-development', category: 'Technical', icon: '🌐', description: 'Build web applications and APIs' },
    { name: 'SQL & Databases', slug: 'sql-databases', category: 'Technical', icon: '🗄️', description: 'Design and query relational databases' },
    { name: 'Problem Solving', slug: 'problem-solving', category: 'Soft Skills', icon: '🧩', description: 'Analytical thinking and problem decomposition' },
    { name: 'Communication', slug: 'communication', category: 'Soft Skills', icon: '💬', description: 'Clear technical and non-technical communication' },
    { name: 'Git & Version Control', slug: 'git-version-control', category: 'Tools', icon: '🔀', description: 'Manage code with Git workflows' },
    { name: 'Docker & DevOps', slug: 'docker-devops', category: 'Tools', icon: '🐳', description: 'Containerization and deployment pipelines' },
    { name: 'API Design', slug: 'api-design', category: 'Technical', icon: '🔌', description: 'Design RESTful and GraphQL APIs' },
    // Sub-skills
    { name: 'Python OOP', slug: 'python-oop', category: 'Technical', icon: '🏗️', description: 'Object-oriented programming in Python', parentSlug: 'python-programming' },
    { name: 'Python Data Structures', slug: 'python-data-structures', category: 'Technical', icon: '📦', description: 'Lists, dicts, sets, tuples and algorithms', parentSlug: 'python-programming' },
    { name: 'Decorators & Generators', slug: 'decorators-generators', category: 'Technical', icon: '✨', description: 'Advanced Python patterns', parentSlug: 'python-programming' },
    { name: 'React Fundamentals', slug: 'react-fundamentals', category: 'Technical', icon: '⚛️', description: 'Component-based UI with React', parentSlug: 'web-development' },
    { name: 'REST API Integration', slug: 'rest-api-integration', category: 'Technical', icon: '🔗', description: 'Consume and build REST APIs', parentSlug: 'api-design' },
  ]

  // Create skills
  const skillMap: Record<string, string> = {}
  for (const def of skillDefs) {
    const parentSkill = def.parentSlug ? await db.skill.findFirst({ where: { slug: def.parentSlug } }) : null
    const skill = await db.skill.create({
      data: {
        name: def.name,
        slug: def.slug,
        category: def.category,
        icon: def.icon,
        description: def.description,
        parentSkillId: parentSkill?.id ?? null,
      },
    })
    skillMap[def.slug] = skill.id
  }

  // Tag courses with skills
  const courses = await db.course.findMany({ take: 10 })
  const courseSkillMappings: Record<string, string[]> = {
    'Python': ['python-programming', 'problem-solving', 'python-oop', 'python-data-structures'],
    'Django': ['python-programming', 'web-development', 'api-design', 'sql-databases'],
    'Data': ['data-analysis', 'python-programming', 'machine-learning', 'sql-databases'],
    'Machine Learning': ['machine-learning', 'python-programming', 'data-analysis'],
    'React': ['web-development', 'react-fundamentals', 'javascript'],
    'SQL': ['sql-databases', 'data-analysis'],
    'API': ['api-design', 'web-development', 'rest-api-integration'],
    'Docker': ['docker-devops', 'git-version-control'],
    'Git': ['git-version-control', 'problem-solving'],
    'Flask': ['python-programming', 'web-development', 'api-design'],
  }

  for (const course of courses) {
    const titleLower = course.title.toLowerCase()
    const matchedSlugs: string[] = []
    for (const [keyword, slugs] of Object.entries(courseSkillMappings)) {
      if (titleLower.includes(keyword.toLowerCase())) {
        matchedSlugs.push(...slugs)
      }
    }
    // Default: tag with Python + Problem Solving
    if (matchedSlugs.length === 0) {
      matchedSlugs.push('python-programming', 'problem-solving')
    }
    const uniqueSlugs = [...new Set(matchedSlugs)]
    for (const slug of uniqueSlugs) {
      const skillId = skillMap[slug]
      if (skillId) {
        await db.courseSkill.upsert({
          where: { courseId_skillId: { courseId: course.id, skillId } },
          create: { courseId: course.id, skillId, isPrimary: uniqueSlugs.indexOf(slug) === 0, weight: uniqueSlugs.indexOf(slug) === 0 ? 1.5 : 1.0 },
          update: {},
        })
      }
    }
  }

  // Tag lessons with skills
  const lessons = await db.lesson.findMany({ take: 30, include: { module: { include: { course: true } } } })
  for (const lesson of lessons) {
    const courseSkills = await db.courseSkill.findMany({
      where: { courseId: lesson.module.courseId },
      include: { skill: true },
    })
    // Tag each lesson with 1-2 skills from its course
    const skillsToTag = courseSkills.slice(0, 2)
    for (const cs of skillsToTag) {
      await db.lessonSkill.upsert({
        where: { lessonId_skillId: { lessonId: lesson.id, skillId: cs.skillId } },
        create: { lessonId: lesson.id, skillId: cs.skillId, weight: cs.weight },
        update: {},
      })
    }
  }

  // Tag questions with skills
  const questions = await db.question.findMany({ take: 30, include: { quiz: { include: { course: true } } } })
  for (const question of questions) {
    const courseId = question.quiz.courseId
    if (!courseId) continue
    const courseSkills = await db.courseSkill.findMany({
      where: { courseId },
      take: 2,
    })
    for (const cs of courseSkills) {
      await db.questionSkill.upsert({
        where: { questionId_skillId: { questionId: question.id, skillId: cs.skillId } },
        create: { questionId: question.id, skillId: cs.skillId },
        update: {},
      })
    }
  }

  // Create career paths
  const existingCareerPaths = await db.careerPath.count()
  if (existingCareerPaths === 0) {
    const juniorPath = await db.careerPath.create({
      data: {
        title: 'Junior Python Developer',
        slug: 'junior-python-developer',
        description: 'Entry-level Python development role focused on writing clean code and building basic applications',
        icon: '🚀',
        category: 'engineering',
      },
    })

    const midPath = await db.careerPath.create({
      data: {
        title: 'Backend Developer',
        slug: 'backend-developer',
        description: 'Mid-level role building scalable APIs and services',
        icon: '⚙️',
        category: 'engineering',
        nextPathId: null, // will link later
      },
    })

    const seniorPath = await db.careerPath.create({
      data: {
        title: 'Senior Developer',
        slug: 'senior-developer',
        description: 'Lead developer role with architecture and mentoring responsibilities',
        icon: '👑',
        category: 'engineering',
      },
    })

    // Link paths
    await db.careerPath.update({ where: { id: juniorPath.id }, data: { nextPathId: midPath.id } })
    await db.careerPath.update({ where: { id: midPath.id }, data: { nextPathId: seniorPath.id } })

    // Junior Python Developer skills
    const juniorSkills = [
      { slug: 'python-programming', requiredLevel: 'Elementary', requiredScore: 45, priority: 'must_have' },
      { slug: 'problem-solving', requiredLevel: 'Beginner', requiredScore: 30, priority: 'must_have' },
      { slug: 'git-version-control', requiredLevel: 'Beginner', requiredScore: 25, priority: 'must_have' },
      { slug: 'sql-databases', requiredLevel: 'Awareness', requiredScore: 15, priority: 'nice_to_have' },
      { slug: 'communication', requiredLevel: 'Awareness', requiredScore: 15, priority: 'nice_to_have' },
    ]

    for (const js of juniorSkills) {
      const skillId = skillMap[js.slug]
      if (skillId) {
        await db.careerPathSkill.create({
          data: { careerPathId: juniorPath.id, skillId, requiredLevel: js.requiredLevel, requiredScore: js.requiredScore, priority: js.priority },
        })
      }
    }

    // Backend Developer skills
    const midSkills = [
      { slug: 'python-programming', requiredLevel: 'Intermediate', requiredScore: 65, priority: 'must_have' },
      { slug: 'api-design', requiredLevel: 'Elementary', requiredScore: 50, priority: 'must_have' },
      { slug: 'web-development', requiredLevel: 'Elementary', requiredScore: 45, priority: 'must_have' },
      { slug: 'sql-databases', requiredLevel: 'Elementary', requiredScore: 45, priority: 'must_have' },
      { slug: 'docker-devops', requiredLevel: 'Beginner', requiredScore: 30, priority: 'nice_to_have' },
      { slug: 'git-version-control', requiredLevel: 'Elementary', requiredScore: 40, priority: 'must_have' },
      { slug: 'problem-solving', requiredLevel: 'Elementary', requiredScore: 50, priority: 'must_have' },
    ]

    for (const ms of midSkills) {
      const skillId = skillMap[ms.slug]
      if (skillId) {
        await db.careerPathSkill.create({
          data: { careerPathId: midPath.id, skillId, requiredLevel: ms.requiredLevel, requiredScore: ms.requiredScore, priority: ms.priority },
        })
      }
    }

    // Senior Developer skills
    const seniorSkills = [
      { slug: 'python-programming', requiredLevel: 'Advanced', requiredScore: 80, priority: 'must_have' },
      { slug: 'api-design', requiredLevel: 'Intermediate', requiredScore: 65, priority: 'must_have' },
      { slug: 'web-development', requiredLevel: 'Intermediate', requiredScore: 65, priority: 'must_have' },
      { slug: 'sql-databases', requiredLevel: 'Intermediate', requiredScore: 60, priority: 'must_have' },
      { slug: 'docker-devops', requiredLevel: 'Elementary', requiredScore: 50, priority: 'must_have' },
      { slug: 'machine-learning', requiredLevel: 'Beginner', requiredScore: 30, priority: 'nice_to_have' },
      { slug: 'communication', requiredLevel: 'Intermediate', requiredScore: 60, priority: 'must_have' },
      { slug: 'problem-solving', requiredLevel: 'Advanced', requiredScore: 80, priority: 'must_have' },
    ]

    for (const ss of seniorSkills) {
      const skillId = skillMap[ss.slug]
      if (skillId) {
        await db.careerPathSkill.create({
          data: { careerPathId: seniorPath.id, skillId, requiredLevel: ss.requiredLevel, requiredScore: ss.requiredScore, priority: ss.priority },
        })
      }
    }
  }
}

// ==================== SKILL EXTRACTION ENGINE ====================

async function calculateSkillScores(userId: string): Promise<Map<string, {
  lessonScore: number
  quizScore: number
  assignmentScore: number
  tutorSignalScore: number
  certBonus: number
  overallScore: number
  level: string
  evidenceCount: number
  sourceCourses: string[]
  evidence: EvidenceItem[]
}>> {
  const result = new Map<string, {
    lessonScore: number
    quizScore: number
    assignmentScore: number
    tutorSignalScore: number
    certBonus: number
    overallScore: number
    level: string
    evidenceCount: number
    sourceCourses: string[]
    evidence: EvidenceItem[]
  }>()

  // Get student's enrollments
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          courseSkills: { include: { skill: true } },
          modules: {
            include: {
              lessons: {
                include: {
                  lessonSkills: { include: { skill: true } },
                },
              },
            },
          },
          quizzes: {
            include: {
              questions: {
                include: {
                  questionSkills: { include: { skill: true } },
                },
              },
            },
          },
          assignments: true,
        },
      },
      lessonProgress: { include: { lesson: true } },
    },
  })

  // Get student's quiz attempts
  const quizAttempts = await db.quizAttempt.findMany({
    where: { userId },
    include: {
      quiz: {
        include: {
          questions: {
            include: {
              questionSkills: { include: { skill: true } },
            },
          },
        },
      },
    },
  })

  // Get student's submissions
  const submissions = await db.submission.findMany({
    where: { studentId: userId },
    include: {
      assignment: {
        include: {
          course: {
            include: {
              courseSkills: { include: { skill: true } },
            },
          },
        },
      },
    },
  })

  // Get certificates
  const certificates = await db.certificate.findMany({
    where: { userId },
  })

  // Get course skills for certificate courses
  const certCourseIds = certificates.map(c => c.courseId)
  const certCourseSkills = certCourseIds.length > 0
    ? await db.courseSkill.findMany({ where: { courseId: { in: certCourseIds } }, include: { skill: true } })
    : []

  // Get AI tutor messages (for tutor signal)
  const tutorMessages = await db.shijlAIMessage.findMany({
    where: { userId, role: 'user' },
  })

  // Collect all skills from all sources
  const skillDataMap = new Map<string, {
    lessonScores: { score: number; courseTitle: string }[]
    quizScores: { score: number; questionText: string }[]
    assignmentScores: { score: number; assignmentTitle: string }[]
    certCourses: string[]
    tutorQuestions: number
    sourceCourses: Set<string>
    evidence: EvidenceItem[]
  }>()

  const initSkillData = (skillId: string) => {
    if (!skillDataMap.has(skillId)) {
      skillDataMap.set(skillId, {
        lessonScores: [],
        quizScores: [],
        assignmentScores: [],
        certCourses: [],
        tutorQuestions: 0,
        sourceCourses: new Set(),
        evidence: [],
      })
    }
    return skillDataMap.get(skillId)!
  }

  // SOURCE 1 & 5: Course metadata + Lesson completion
  for (const enrollment of enrollments) {
    const course = enrollment.course
    const courseSkillIds = course.courseSkills.map(cs => cs.skillId)
    const courseTitle = course.title

    for (const cs of course.courseSkills) {
      const data = initSkillData(cs.skillId)
      data.sourceCourses.add(courseTitle)

      // SOURCE 5: Lesson completion - lessons tagged with this skill
      const skillLessonProgress: { watchPercent: number; lessonTitle: string }[] = []
      for (const moduleItem of course.modules) {
        for (const lesson of moduleItem.lessons) {
          const hasSkill = lesson.lessonSkills.some(ls => ls.skillId === cs.skillId)
          if (hasSkill) {
            const lp = enrollment.lessonProgress.find(p => p.lessonId === lesson.id)
            let watchPercent = 0
            if (lp) {
              if (lp.status === 'completed') {
                watchPercent = 100
              } else if (lp.status === 'in_progress' && lesson.duration > 0) {
                watchPercent = Math.min(100, Math.round((lp.timeSpent / (lesson.duration * 60)) * 100))
              }
            }
            skillLessonProgress.push({ watchPercent, lessonTitle: lesson.title })
          }
        }
      }

      if (skillLessonProgress.length > 0) {
        const avgWatch = skillLessonProgress.reduce((sum, p) => sum + p.watchPercent, 0) / skillLessonProgress.length
        data.lessonScores.push({ score: avgWatch, courseTitle })
        // Add evidence for each lesson
        for (const lp of skillLessonProgress) {
          data.evidence.push({
            source: 'Lesson Completion',
            item: lp.lessonTitle,
            contribution: `${lp.watchPercent}% watched`,
            type: lp.watchPercent >= 80 ? 'positive' : lp.watchPercent >= 40 ? 'neutral' : 'negative',
          })
        }
      } else {
        // No lessons tagged — use enrollment progress as proxy
        data.lessonScores.push({ score: enrollment.progress, courseTitle })
      }
    }

    // SOURCE 5: Lesson skills not covered by course skills
    for (const moduleItem of course.modules) {
      for (const lesson of moduleItem.lessons) {
        for (const ls of lesson.lessonSkills) {
          if (!courseSkillIds.includes(ls.skillId)) {
            const data = initSkillData(ls.skillId)
            data.sourceCourses.add(courseTitle)
            const lp = enrollment.lessonProgress.find(p => p.lessonId === lesson.id)
            let watchPercent = 0
            if (lp) {
              if (lp.status === 'completed') {
                watchPercent = 100
              } else if (lp.status === 'in_progress' && lesson.duration > 0) {
                watchPercent = Math.min(100, Math.round((lp.timeSpent / (lesson.duration * 60)) * 100))
              }
            }
            data.lessonScores.push({ score: watchPercent, courseTitle })
            data.evidence.push({
              source: 'Lesson Completion',
              item: lesson.title,
              contribution: `${watchPercent}% watched`,
              type: watchPercent >= 80 ? 'positive' : watchPercent >= 40 ? 'neutral' : 'negative',
            })
          }
        }
      }
    }
  }

  // SOURCE 2: Quiz Performance
  for (const attempt of quizAttempts) {
    if (!attempt.completedAt) continue
    for (const question of attempt.quiz.questions) {
      for (const qs of question.questionSkills) {
        const data = initSkillData(qs.skillId)
        const scorePct = attempt.maxScore > 0 ? (attempt.score / attempt.maxScore) * 100 : 0
        data.quizScores.push({ score: scorePct, questionText: question.text.substring(0, 60) })
        data.evidence.push({
          source: 'Quiz Performance',
          item: question.text.substring(0, 60) + '...',
          contribution: `${Math.round(scorePct)}% correct`,
          type: scorePct >= 70 ? 'positive' : scorePct >= 40 ? 'neutral' : 'negative',
        })
      }
    }

    // Also attribute quiz performance to course skills
    const courseId = attempt.quiz.courseId
    if (courseId) {
      const courseSkills = await db.courseSkill.findMany({ where: { courseId } })
      for (const cs of courseSkills) {
        const data = initSkillData(cs.skillId)
        const scorePct = attempt.maxScore > 0 ? (attempt.score / attempt.maxScore) * 100 : 0
        data.quizScores.push({ score: scorePct, questionText: `Quiz: ${attempt.quiz.title}` })
      }
    }
  }

  // SOURCE 3: Assignment Grades
  for (const sub of submissions) {
    if (sub.score === null) continue
    const course = sub.assignment.course
    const scorePct = sub.assignment.maxScore > 0 ? (sub.score / sub.assignment.maxScore) * 100 : 0
    for (const cs of course.courseSkills) {
      const data = initSkillData(cs.skillId)
      data.assignmentScores.push({ score: scorePct, assignmentTitle: sub.assignment.title })
      data.evidence.push({
        source: 'Assignment Grade',
        item: sub.assignment.title,
        contribution: `${Math.round(scorePct)}% score`,
        type: scorePct >= 70 ? 'positive' : scorePct >= 40 ? 'neutral' : 'negative',
      })
    }
  }

  // SOURCE 4: AI Tutor Signal (inverted: more Qs = lower score)
  const skillKeywords: Record<string, string[]> = {
    'python-programming': ['python', 'django', 'flask', 'decorator', 'generator', 'list comprehension', 'oop', 'class', 'function'],
    'data-analysis': ['pandas', 'numpy', 'dataframe', 'analysis', 'statistics', 'visualization', 'matplotlib'],
    'machine-learning': ['machine learning', 'neural network', 'deep learning', 'model', 'training', 'tensorflow', 'pytorch', 'sklearn'],
    'web-development': ['html', 'css', 'javascript', 'react', 'frontend', 'backend', 'node', 'web'],
    'sql-databases': ['sql', 'database', 'query', 'table', 'join', 'postgres', 'mysql', 'sqlite'],
    'api-design': ['api', 'rest', 'endpoint', 'request', 'response', 'graphql', 'http'],
    'git-version-control': ['git', 'github', 'commit', 'branch', 'merge', 'pull request', 'version control'],
    'docker-devops': ['docker', 'container', 'kubernetes', 'deploy', 'ci/cd', 'devops', 'pipeline'],
    'problem-solving': ['algorithm', 'logic', 'debug', 'error', 'fix', 'solve', 'issue'],
    'communication': ['explain', 'document', 'write', 'present', 'communicate'],
  }

  // Count tutor questions per skill
  const tutorQuestionCounts = new Map<string, number>()
  for (const msg of tutorMessages) {
    const contentLower = msg.content.toLowerCase()
    for (const [slug, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(kw => contentLower.includes(kw))) {
        tutorQuestionCounts.set(slug, (tutorQuestionCounts.get(slug) || 0) + 1)
      }
    }
  }

  // Apply tutor signal to all skills in our map
  const allSkills = await db.skill.findMany()
  for (const [skillId, data] of skillDataMap) {
    const skill = allSkills.find(s => s.id === skillId)
    if (skill) {
      const questionCount = tutorQuestionCounts.get(skill.slug) || 0
      data.tutorQuestions = questionCount
      if (questionCount > 0) {
        // Inverted: more questions = lower confidence
        // 0 Qs = 100, 1-2 Qs = 80, 3-5 Qs = 60, 6-10 Qs = 40, 10+ = 20
        let tutorScore = 100
        if (questionCount <= 2) tutorScore = 80
        else if (questionCount <= 5) tutorScore = 60
        else if (questionCount <= 10) tutorScore = 40
        else tutorScore = 20
        data.evidence.push({
          source: 'AI Tutor Signal',
          item: `${questionCount} questions asked`,
          contribution: `Confidence: ${tutorScore}%`,
          type: tutorScore >= 70 ? 'positive' : tutorScore >= 40 ? 'neutral' : 'negative',
        })
      }
    }
  }

  // SOURCE 6: Certificates
  for (const cert of certificates) {
    const courseSkillsForCert = certCourseSkills.filter(cs => cs.courseId === cert.courseId)
    for (const cs of courseSkillsForCert) {
      const data = initSkillData(cs.skillId)
      data.certCourses.push(cert.courseTitle)
      data.evidence.push({
        source: 'Certificate',
        item: cert.courseTitle,
        contribution: 'Verified proficiency',
        type: 'positive',
      })
    }
  }

  // Calculate final scores
  for (const [skillId, data] of skillDataMap) {
    // Lesson score: average watch%
    const lessonScore = data.lessonScores.length > 0
      ? data.lessonScores.reduce((sum, s) => sum + s.score, 0) / data.lessonScores.length
      : 0

    // Quiz score: average correctness
    const quizScore = data.quizScores.length > 0
      ? data.quizScores.reduce((sum, s) => sum + s.score, 0) / data.quizScores.length
      : 0

    // Assignment score: average grade
    const assignmentScore = data.assignmentScores.length > 0
      ? data.assignmentScores.reduce((sum, s) => sum + s.score, 0) / data.assignmentScores.length
      : 0

    // Tutor signal: inverted from question count
    const tutorSignalScore = data.tutorQuestions === 0
      ? 70 // Default to neutral-positive if no questions asked (we don't know)
      : data.tutorQuestions <= 2 ? 80
      : data.tutorQuestions <= 5 ? 60
      : data.tutorQuestions <= 10 ? 40
      : 20

    // Cert bonus: 100 if certified, 0 otherwise
    const certBonus = data.certCourses.length > 0 ? 100 : 0

    const overallScore = computeOverallScore(lessonScore, quizScore, assignmentScore, tutorSignalScore, certBonus)
    const level = scoreToLevel(overallScore)
    const evidenceCount = data.evidence.length

    result.set(skillId, {
      lessonScore: Math.round(lessonScore * 10) / 10,
      quizScore: Math.round(quizScore * 10) / 10,
      assignmentScore: Math.round(assignmentScore * 10) / 10,
      tutorSignalScore,
      certBonus,
      overallScore,
      level,
      evidenceCount,
      sourceCourses: Array.from(data.sourceCourses),
      evidence: data.evidence.slice(0, 20), // cap evidence
    })
  }

  return result
}

// ==================== DEMO DATA GENERATORS ====================

function generateDemoSkillScores(userId: string): Map<string, {
  lessonScore: number
  quizScore: number
  assignmentScore: number
  tutorSignalScore: number
  certBonus: number
  overallScore: number
  level: string
  evidenceCount: number
  sourceCourses: string[]
  evidence: EvidenceItem[]
}> {
  const result = new Map<string, {
    lessonScore: number
    quizScore: number
    assignmentScore: number
    tutorSignalScore: number
    certBonus: number
    overallScore: number
    level: string
    evidenceCount: number
    sourceCourses: string[]
    evidence: EvidenceItem[]
  }>()

  const demoSkills = [
    { id: 'demo-skill-1', slug: 'python-programming', lessonScore: 72, quizScore: 68, assignmentScore: 75, tutorSignalScore: 60, certBonus: 100, sourceCourses: ['Python for Beginners', 'Advanced Python'] },
    { id: 'demo-skill-2', slug: 'data-analysis', lessonScore: 65, quizScore: 58, assignmentScore: 62, tutorSignalScore: 80, certBonus: 0, sourceCourses: ['Data Analysis with Python'] },
    { id: 'demo-skill-3', slug: 'machine-learning', lessonScore: 45, quizScore: 42, assignmentScore: 38, tutorSignalScore: 40, certBonus: 0, sourceCourses: ['Intro to Machine Learning'] },
    { id: 'demo-skill-4', slug: 'web-development', lessonScore: 58, quizScore: 52, assignmentScore: 60, tutorSignalScore: 60, certBonus: 0, sourceCourses: ['Web Dev Bootcamp'] },
    { id: 'demo-skill-5', slug: 'sql-databases', lessonScore: 55, quizScore: 48, assignmentScore: 50, tutorSignalScore: 80, certBonus: 0, sourceCourses: ['SQL Fundamentals'] },
    { id: 'demo-skill-6', slug: 'problem-solving', lessonScore: 70, quizScore: 72, assignmentScore: 68, tutorSignalScore: 70, certBonus: 0, sourceCourses: ['Python for Beginners', 'Algorithm Design'] },
    { id: 'demo-skill-7', slug: 'communication', lessonScore: 50, quizScore: 55, assignmentScore: 45, tutorSignalScore: 80, certBonus: 0, sourceCourses: [] },
    { id: 'demo-skill-8', slug: 'git-version-control', lessonScore: 40, quizScore: 35, assignmentScore: 30, tutorSignalScore: 60, certBonus: 0, sourceCourses: ['DevOps Essentials'] },
    { id: 'demo-skill-9', slug: 'docker-devops', lessonScore: 25, quizScore: 20, assignmentScore: 15, tutorSignalScore: 80, certBonus: 0, sourceCourses: [] },
    { id: 'demo-skill-10', slug: 'api-design', lessonScore: 50, quizScore: 45, assignmentScore: 48, tutorSignalScore: 60, certBonus: 0, sourceCourses: ['REST API Design'] },
    // Sub-skills
    { id: 'demo-skill-11', slug: 'python-oop', lessonScore: 65, quizScore: 60, assignmentScore: 70, tutorSignalScore: 60, certBonus: 0, sourceCourses: ['Python for Beginners'] },
    { id: 'demo-skill-12', slug: 'python-data-structures', lessonScore: 70, quizScore: 65, assignmentScore: 72, tutorSignalScore: 70, certBonus: 0, sourceCourses: ['Python for Beginners'] },
    { id: 'demo-skill-13', slug: 'decorators-generators', lessonScore: 40, quizScore: 35, assignmentScore: 30, tutorSignalScore: 40, certBonus: 0, sourceCourses: ['Advanced Python'] },
    { id: 'demo-skill-14', slug: 'react-fundamentals', lessonScore: 48, quizScore: 42, assignmentScore: 55, tutorSignalScore: 60, certBonus: 0, sourceCourses: ['Web Dev Bootcamp'] },
    { id: 'demo-skill-15', slug: 'rest-api-integration', lessonScore: 52, quizScore: 48, assignmentScore: 50, tutorSignalScore: 60, certBonus: 0, sourceCourses: ['REST API Design'] },
  ]

  const demoEvidenceMap: Record<string, EvidenceItem[]> = {
    'python-programming': [
      { source: 'Lesson Completion', item: 'Variables & Data Types', contribution: '100% watched', type: 'positive' },
      { source: 'Lesson Completion', item: 'Functions & Modules', contribution: '85% watched', type: 'positive' },
      { source: 'Quiz Performance', item: 'Python Basics Quiz', contribution: '78% correct', type: 'positive' },
      { source: 'Assignment Grade', item: 'Build a Calculator', contribution: '82% score', type: 'positive' },
      { source: 'AI Tutor Signal', item: '3 questions asked', contribution: 'Confidence: 60%', type: 'neutral' },
      { source: 'Certificate', item: 'Python for Beginners', contribution: 'Verified proficiency', type: 'positive' },
    ],
    'data-analysis': [
      { source: 'Lesson Completion', item: 'Pandas Fundamentals', contribution: '80% watched', type: 'positive' },
      { source: 'Quiz Performance', item: 'Data Wrangling Quiz', contribution: '62% correct', type: 'neutral' },
      { source: 'Assignment Grade', item: 'Analyze Sales Data', contribution: '68% score', type: 'neutral' },
    ],
    'machine-learning': [
      { source: 'Lesson Completion', item: 'Intro to ML', contribution: '60% watched', type: 'neutral' },
      { source: 'Quiz Performance', item: 'ML Concepts Quiz', contribution: '45% correct', type: 'negative' },
      { source: 'AI Tutor Signal', item: '8 questions asked', contribution: 'Confidence: 40%', type: 'negative' },
    ],
  }

  for (const ds of demoSkills) {
    const overallScore = computeOverallScore(ds.lessonScore, ds.quizScore, ds.assignmentScore, ds.tutorSignalScore, ds.certBonus)
    const level = scoreToLevel(overallScore)
    result.set(ds.id, {
      lessonScore: ds.lessonScore,
      quizScore: ds.quizScore,
      assignmentScore: ds.assignmentScore,
      tutorSignalScore: ds.tutorSignalScore,
      certBonus: ds.certBonus,
      overallScore,
      level,
      evidenceCount: demoEvidenceMap[ds.slug]?.length || 2,
      sourceCourses: ds.sourceCourses,
      evidence: demoEvidenceMap[ds.slug] || [
        { source: 'Course Metadata', item: ds.sourceCourses[0] || 'General', contribution: 'Skill tagged to course', type: 'neutral' as const },
      ],
    })
  }

  return result
}

function generateDemoSkillHistory(skillIds: string[], skillNames: string[]): SkillHistoryEntry[] {
  const now = new Date()
  return skillIds.map((skillId, idx) => {
    const baseScore = 20 + Math.floor(Math.random() * 50)
    const points: SkillHistoryPoint[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i * 7)
      const score = Math.min(100, Math.max(0, baseScore + (6 - i) * (3 + Math.floor(Math.random() * 5)) + Math.floor(Math.random() * 10 - 5)))
      points.push({
        date: date.toISOString().split('T')[0],
        score,
        level: scoreToLevel(score),
        event: i === 0 ? 'Daily recalculation' : (i % 2 === 0 ? 'Completed quiz' : null),
      })
    }
    return { skillId, skillName: skillNames[idx], points }
  })
}

function generateDemoCareerPaths(userScores: Map<string, { overallScore: number; slug: string }>): CareerPathItem[] {
  const paths: CareerPathItem[] = [
    {
      id: 'demo-path-1',
      title: 'Junior Python Developer',
      slug: 'junior-python-developer',
      description: 'Entry-level Python development role',
      icon: '🚀',
      readiness: 0,
      skills: [
        { name: 'Python Programming', requiredLevel: 'Elementary', requiredScore: 45, yourScore: 0, gap: 'none' as const },
        { name: 'Problem Solving', requiredLevel: 'Beginner', requiredScore: 30, yourScore: 0, gap: 'none' as const },
        { name: 'Git & Version Control', requiredLevel: 'Beginner', requiredScore: 25, yourScore: 0, gap: 'large' as const },
        { name: 'SQL & Databases', requiredLevel: 'Awareness', requiredScore: 15, yourScore: 0, gap: 'none' as const },
        { name: 'Communication', requiredLevel: 'Awareness', requiredScore: 15, yourScore: 0, gap: 'none' as const },
      ],
      aiAdvice: 'Focus on improving your Git skills — this is a key gap for the Junior Python Developer role. Consider taking the DevOps Essentials course.',
      recommendedCourses: [
        { title: 'Git & GitHub Mastery', price: 0, duration: '4 hours' },
        { title: 'Python Projects Bootcamp', price: 29.99, duration: '12 hours' },
      ],
    },
    {
      id: 'demo-path-2',
      title: 'Backend Developer',
      slug: 'backend-developer',
      description: 'Mid-level role building scalable APIs and services',
      icon: '⚙️',
      readiness: 0,
      skills: [
        { name: 'Python Programming', requiredLevel: 'Intermediate', requiredScore: 65, yourScore: 0, gap: 'medium' as const },
        { name: 'API Design', requiredLevel: 'Elementary', requiredScore: 50, yourScore: 0, gap: 'none' as const },
        { name: 'Web Development', requiredLevel: 'Elementary', requiredScore: 45, yourScore: 0, gap: 'small' as const },
        { name: 'SQL & Databases', requiredLevel: 'Elementary', requiredScore: 45, yourScore: 0, gap: 'none' as const },
        { name: 'Docker & DevOps', requiredLevel: 'Beginner', requiredScore: 30, yourScore: 0, gap: 'large' as const },
        { name: 'Git & Version Control', requiredLevel: 'Elementary', requiredScore: 40, yourScore: 0, gap: 'large' as const },
      ],
      aiAdvice: 'You have a solid foundation in Python. To reach Backend Developer level, focus on Docker, Git, and building more API projects.',
      recommendedCourses: [
        { title: 'Docker & Kubernetes for Developers', price: 39.99, duration: '16 hours' },
        { title: 'REST API Masterclass', price: 24.99, duration: '10 hours' },
      ],
    },
    {
      id: 'demo-path-3',
      title: 'Senior Developer',
      slug: 'senior-developer',
      description: 'Lead developer with architecture and mentoring responsibilities',
      icon: '👑',
      readiness: 0,
      skills: [
        { name: 'Python Programming', requiredLevel: 'Advanced', requiredScore: 80, yourScore: 0, gap: 'large' as const },
        { name: 'API Design', requiredLevel: 'Intermediate', requiredScore: 65, yourScore: 0, gap: 'medium' as const },
        { name: 'Web Development', requiredLevel: 'Intermediate', requiredScore: 65, yourScore: 0, gap: 'medium' as const },
        { name: 'SQL & Databases', requiredLevel: 'Intermediate', requiredScore: 60, yourScore: 0, gap: 'medium' as const },
        { name: 'Docker & DevOps', requiredLevel: 'Elementary', requiredScore: 50, yourScore: 0, gap: 'large' as const },
        { name: 'Machine Learning', requiredLevel: 'Beginner', requiredScore: 30, yourScore: 0, gap: 'small' as const },
        { name: 'Communication', requiredLevel: 'Intermediate', requiredScore: 60, yourScore: 0, gap: 'medium' as const },
      ],
      aiAdvice: 'The Senior Developer path requires strong skills across the board. Prioritize advanced Python and system design.',
      recommendedCourses: [
        { title: 'System Design for Senior Engineers', price: 49.99, duration: '20 hours' },
        { title: 'Advanced Python Patterns', price: 34.99, duration: '14 hours' },
      ],
    },
  ]

  return paths
}

function generateDemoComparisons(skills: { name: string; overallScore: number }[]): ComparisonItem[] {
  return skills.map(s => {
    const avgOffset = 5 + Math.floor(Math.random() * 15)
    const topOffset = 15 + Math.floor(Math.random() * 20)
    return {
      skillName: s.name,
      yourScore: s.overallScore,
      avgScore: Math.min(100, Math.max(0, s.overallScore - avgOffset + Math.floor(Math.random() * 10 - 5))),
      topTenScore: Math.min(100, Math.max(0, s.overallScore + topOffset)),
    }
  })
}

function generateDemoChallenges(skills: { name: string; level: string; overallScore: number }[]): ChallengeItem[] {
  const challenges: ChallengeItem[] = [
    {
      id: 'challenge-1',
      title: 'Python Speed Challenge',
      description: 'Solve 10 Python problems as fast as you can. Tests your Python fundamentals under time pressure.',
      xpReward: 150,
      badge: '⚡ Speed Demon',
      difficulty: 3,
      status: 'available',
      requiredLevel: 'Elementary',
      progress: 0,
      bestTime: null,
      completedAt: null,
    },
    {
      id: 'challenge-2',
      title: 'SQL Query Master',
      description: 'Write complex SQL queries to extract insights from a sample database.',
      xpReward: 200,
      badge: '🗄️ Data Wizard',
      difficulty: 4,
      status: 'available',
      requiredLevel: 'Beginner',
      progress: 0,
      bestTime: null,
      completedAt: null,
    },
    {
      id: 'challenge-3',
      title: 'API Design Sprint',
      description: 'Design a RESTful API for a social media platform in under 30 minutes.',
      xpReward: 250,
      badge: '🔌 API Architect',
      difficulty: 4,
      status: 'locked',
      requiredLevel: 'Intermediate',
      progress: 0,
      bestTime: null,
      completedAt: null,
    },
    {
      id: 'challenge-4',
      title: 'Debug Detective',
      description: 'Find and fix bugs in 5 Python code snippets. Tests problem-solving and debugging skills.',
      xpReward: 100,
      badge: '🔍 Bug Hunter',
      difficulty: 2,
      status: 'completed',
      requiredLevel: 'Beginner',
      progress: 100,
      bestTime: '4m 32s',
      completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'challenge-5',
      title: 'Docker Deployment',
      description: 'Containerize and deploy a Python web application using Docker.',
      xpReward: 300,
      badge: '🐳 Container Pro',
      difficulty: 5,
      status: 'locked',
      requiredLevel: 'Elementary',
      progress: 0,
      bestTime: null,
      completedAt: null,
    },
    {
      id: 'challenge-6',
      title: 'Data Viz Challenge',
      description: 'Create compelling data visualizations from a messy dataset.',
      xpReward: 175,
      badge: '📊 Viz Master',
      difficulty: 3,
      status: 'available',
      requiredLevel: 'Beginner',
      progress: 35,
      bestTime: null,
      completedAt: null,
    },
  ]

  return challenges
}

function generateAIInsight(skill: {
  name: string
  overallScore: number
  lessonScore: number
  quizScore: number
  assignmentScore: number
  tutorSignalScore: number
  certBonus: number
}): string | null {
  const insights: string[] = []
  const strongComponents: string[] = []
  const weakComponents: string[] = []

  if (skill.lessonScore >= 70) strongComponents.push('lesson engagement')
  else if (skill.lessonScore < 40) weakComponents.push('lesson engagement')

  if (skill.quizScore >= 70) strongComponents.push('quiz performance')
  else if (skill.quizScore < 40) weakComponents.push('quiz performance')

  if (skill.assignmentScore >= 70) strongComponents.push('assignment quality')
  else if (skill.assignmentScore < 40) weakComponents.push('assignment quality')

  if (skill.tutorSignalScore >= 70) strongComponents.push('self-confidence')
  else if (skill.tutorSignalScore < 40) weakComponents.push('understanding (many tutor questions)')

  if (skill.certBonus > 0) strongComponents.push('certified proficiency')

  if (strongComponents.length > 0 && weakComponents.length > 0) {
    insights.push(`Strong in ${strongComponents.join(', ')}, but needs work on ${weakComponents.join(', ')}.`)
  } else if (strongComponents.length > 0) {
    insights.push(`Performing well across ${strongComponents.join(', ')}. Keep up the momentum!`)
  } else if (weakComponents.length > 0) {
    insights.push(`Struggling with ${weakComponents.join(', ')}. Consider revisiting fundamentals or asking for help.`)
  }

  if (skill.overallScore >= 76) {
    insights.push(`At ${skill.overallScore}%, you're approaching expert level. Challenge yourself with advanced projects.`)
  } else if (skill.overallScore >= 61) {
    insights.push(`Solid intermediate level. Focus on practice projects to push toward advanced.`)
  } else if (skill.overallScore >= 41) {
    insights.push(`Building a good foundation. More quiz practice and assignments will accelerate growth.`)
  } else if (skill.overallScore > 0) {
    insights.push(`Early stage — consistent study and hands-on practice are key to leveling up.`)
  }

  return insights.length > 0 ? insights.join(' ') : null
}

// ==================== GET HANDLER ====================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 })
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: { include: { course: true } },
        certificates: true,
        userSkills: { include: { skill: { include: { subSkills: true } }, history: { orderBy: { recordedAt: 'desc' } } } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure skill data is seeded
    await ensureSkillsSeeded(userId)

    // Try to calculate real skill scores from the extraction engine
    const realScores = await calculateSkillScores(userId)
    const hasRealData = realScores.size > 0

    // If no real data, generate demo scores
    const skillScores = hasRealData ? realScores : generateDemoSkillScores(userId)

    // Get all skills from DB for metadata
    const allSkills = await db.skill.findMany({
      include: {
        subSkills: true,
        courseSkills: { include: { course: true } },
        careerPathSkills: { include: { careerPath: true } },
      },
    })

    // Get career paths from DB
    const dbCareerPaths = await db.careerPath.findMany({
      include: {
        requiredSkills: { include: { skill: true } },
        prevPaths: true,
      },
    })

    // Build skills detail array
    const skillsDetail: SkillDetail[] = []
    for (const [skillId, scores] of skillScores) {
      const dbSkill = allSkills.find(s => s.id === skillId)
      const slug = dbSkill?.slug || 'unknown'
      const name = dbSkill?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      const category = dbSkill?.category || 'Technical'
      const icon = dbSkill?.icon || null
      const isVerified = scores.certBonus > 0
      const verifiedBy = isVerified ? scores.sourceCourses[0] || null : null

      // Check if this is a gap skill (required for career path but low score)
      let isGap = false
      let careerRelevance: string | null = null
      if (dbSkill) {
        for (const cps of dbSkill.careerPathSkills) {
          if (scores.overallScore < cps.requiredScore) {
            isGap = true
            careerRelevance = `Required for ${cps.careerPath.title}`
            break
          }
        }
      }

      // Check if recommended (not started but suggested by career path)
      const isRecommended = scores.overallScore === 0 && careerRelevance !== null

      // Sub-skills
      const subSkills: SubSkill[] = []
      if (dbSkill) {
        for (const sub of dbSkill.subSkills) {
          const subScore = skillScores.get(sub.id)
          if (subScore) {
            subSkills.push({ name: sub.name, score: subScore.overallScore, level: subScore.level })
          } else {
            // Generate a demo sub-skill score based on parent
            const subDemoScore = Math.max(0, Math.min(100, scores.overallScore + (Math.floor(Math.random() * 30) - 15)))
            subSkills.push({ name: sub.name, score: subDemoScore, level: scoreToLevel(subDemoScore) })
          }
        }
      }

      // AI Insight
      const aiInsight = generateAIInsight({
        name,
        overallScore: scores.overallScore,
        lessonScore: scores.lessonScore,
        quizScore: scores.quizScore,
        assignmentScore: scores.assignmentScore,
        tutorSignalScore: scores.tutorSignalScore,
        certBonus: scores.certBonus,
      })

      skillsDetail.push({
        id: skillId,
        name,
        slug,
        category,
        icon,
        overallScore: scores.overallScore,
        level: scores.level,
        isVerified,
        verifiedBy,
        isGap,
        isRecommended,
        lessonScore: scores.lessonScore,
        quizScore: scores.quizScore,
        assignmentScore: scores.assignmentScore,
        tutorSignalScore: scores.tutorSignalScore,
        certBonus: scores.certBonus,
        evidenceCount: scores.evidenceCount,
        subSkills,
        evidence: scores.evidence,
        aiInsight,
        sourceCourses: scores.sourceCourses,
        careerRelevance,
      })
    }

    // Sort skills: verified first, then by score descending
    skillsDetail.sort((a, b) => {
      if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1
      return b.overallScore - a.overallScore
    })

    // SECTION A: Hero Card
    const totalSkillsTracked = skillsDetail.length
    const verifiedSkills = skillsDetail.filter(s => s.isVerified).length
    const inProgressSkills = skillsDetail.filter(s => s.overallScore > 0 && !s.isVerified).length
    const overallScore = skillsDetail.length > 0
      ? Math.round(skillsDetail.reduce((sum, s) => sum + s.overallScore, 0) / skillsDetail.length)
      : 0

    // Determine skill title based on top skills
    let skillTitle = 'Curious Learner'
    let skillTitleDescription = 'Just starting your learning journey'
    if (overallScore >= 76) { skillTitle = 'Python Expert'; skillTitleDescription = 'Advanced proficiency across multiple skill domains' }
    else if (overallScore >= 61) { skillTitle = 'Python Practitioner'; skillTitleDescription = 'Solid intermediate skills with growing expertise' }
    else if (overallScore >= 41) { skillTitle = 'Python Explorer'; skillTitleDescription = 'Building foundations across key technical skills' }
    else if (overallScore >= 21) { skillTitle = 'Python Novice'; skillTitleDescription = 'Getting started with Python and related technologies' }

    // Closest career path
    const closestCareerPath = dbCareerPaths.length > 0 ? dbCareerPaths[0].title : 'Junior Python Developer'

    // Next level skills to work on
    const nextLevelSkills = skillsDetail
      .filter(s => s.overallScore > 0 && s.overallScore < 76)
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 3)
      .map(s => s.name)

    // Score change (month-over-month)
    const scoreChange = Math.floor(Math.random() * 8) + 1 // demo: positive trend

    // SECTION B: Skill Radar
    const topSkillsForRadar = skillsDetail
      .filter(s => s.category === 'Technical' && !s.slug.includes('-oop') && !s.slug.includes('-data-structures') && !s.slug.includes('-fundamentals') && !s.slug.includes('-integration') && !s.slug.includes('decorators'))
      .slice(0, 8)
    const skillRadar: SkillRadarItem[] = topSkillsForRadar.map(s => ({
      name: s.name,
      score: s.overallScore,
      target: 80, // target score for "Advanced" level
    }))

    // SECTION E: Skill History
    const skillHistory: SkillHistoryEntry[] = []
    if (user.userSkills.length > 0) {
      // Use real history from DB
      for (const us of user.userSkills) {
        if (us.history.length > 0) {
          skillHistory.push({
            skillId: us.skillId,
            skillName: us.skill.name,
            points: us.history.map(h => ({
              date: h.recordedAt.toISOString().split('T')[0],
              score: Math.round(h.score),
              level: h.level,
              event: h.event,
            })),
          })
        }
      }
    }
    // If no real history, generate demo
    if (skillHistory.length === 0) {
      const historySkillIds = skillsDetail.slice(0, 5).map(s => s.id)
      const historySkillNames = skillsDetail.slice(0, 5).map(s => s.name)
      const demoHistory = generateDemoSkillHistory(historySkillIds, historySkillNames)
      skillHistory.push(...demoHistory)
    }

    // SECTION F: Career Paths
    const careerPaths: CareerPathItem[] = []

    if (dbCareerPaths.length > 0) {
      // Build from DB career paths
      for (const cp of dbCareerPaths) {
        const pathSkills: CareerPathSkillGap[] = cp.requiredSkills.map(rs => {
          const userSkillForThis = skillsDetail.find(s => s.id === rs.skillId)
          const yourScore = userSkillForThis?.overallScore || 0
          const gap = yourScore >= rs.requiredScore ? 'none' as const
            : yourScore >= rs.requiredScore - 10 ? 'small' as const
            : yourScore >= rs.requiredScore - 25 ? 'medium' as const
            : 'large' as const
          return {
            name: rs.skill.name,
            requiredLevel: rs.requiredLevel,
            requiredScore: rs.requiredScore,
            yourScore,
            gap,
          }
        })

        const metCount = pathSkills.filter(s => s.gap === 'none').length
        const readiness = pathSkills.length > 0 ? Math.round((metCount / pathSkills.length) * 100) : 0

        // Generate AI advice
        const gapSkills = pathSkills.filter(s => s.gap !== 'none').map(s => s.name)
        let aiAdvice: string | null = null
        if (gapSkills.length > 0) {
          aiAdvice = `To progress toward ${cp.title}, focus on improving: ${gapSkills.slice(0, 3).join(', ')}. ${gapSkills.length > 3 ? `and ${gapSkills.length - 3} more skills.` : ''}`
        } else {
          aiAdvice = `Congratulations! You meet all the skill requirements for ${cp.title}. Consider applying for roles at this level.`
        }

        // Recommended courses from DB
        const recommendedCourses = await db.course.findMany({
          where: {
            isPublished: true,
            courseSkills: { some: { skillId: { in: cp.requiredSkills.filter(rs => {
              const us = skillsDetail.find(s => s.id === rs.skillId)
              return !us || us.overallScore < rs.requiredScore
            }).map(rs => rs.skillId) } } },
          },
          take: 2,
        })

        careerPaths.push({
          id: cp.id,
          title: cp.title,
          slug: cp.slug,
          description: cp.description,
          icon: cp.icon,
          readiness,
          skills: pathSkills,
          aiAdvice,
          recommendedCourses: recommendedCourses.length > 0
            ? recommendedCourses.map(c => ({ title: c.title, price: c.price, duration: `${c.estimatedDuration}h` }))
            : [{ title: 'Python Projects Bootcamp', price: 29.99, duration: '12 hours' }],
        })
      }
    } else {
      // Demo career paths
      const demoPaths = generateDemoCareerPaths(skillScores)
      // Fill in yourScore from actual skill scores
      for (const path of demoPaths) {
        for (const ps of path.skills) {
          const matchingSkill = skillsDetail.find(s => s.name === ps.name)
          if (matchingSkill) {
            ps.yourScore = matchingSkill.overallScore
            ps.gap = ps.yourScore >= ps.requiredScore ? 'none'
              : ps.yourScore >= ps.requiredScore - 10 ? 'small'
              : ps.yourScore >= ps.requiredScore - 25 ? 'medium'
              : 'large'
          }
        }
        const metCount = path.skills.filter(s => s.gap === 'none').length
        path.readiness = path.skills.length > 0 ? Math.round((metCount / path.skills.length) * 100) : 0
      }
      careerPaths.push(...demoPaths)
    }

    // SECTION G: Comparisons
    const comparisons: ComparisonItem[] = generateDemoComparisons(
      skillsDetail.map(s => ({ name: s.name, overallScore: s.overallScore }))
    )

    // Also check for real comparison data from other students
    const allUserSkills = await db.userSkill.findMany({
      where: { userId: { not: userId } },
      include: { skill: true },
    })
    if (allUserSkills.length > 0) {
      // Group by skill and compute averages
      const skillAgg = new Map<string, { scores: number[] }>()
      for (const us of allUserSkills) {
        const existing = skillAgg.get(us.skillId) || { scores: [] }
        existing.scores.push(us.overallScore)
        skillAgg.set(us.skillId, existing)
      }
      // Replace demo comparisons with real data where available
      for (const comp of comparisons) {
        const matchingSkill = skillsDetail.find(s => s.name === comp.skillName)
        if (matchingSkill) {
          const agg = skillAgg.get(matchingSkill.id)
          if (agg && agg.scores.length > 0) {
            const sorted = agg.scores.sort((a, b) => b - a)
            comp.avgScore = Math.round(sorted.reduce((sum, s) => sum + s, 0) / sorted.length)
            comp.topTenScore = Math.round(sorted.slice(0, Math.min(10, sorted.length)).reduce((sum, s) => sum + s, 0) / Math.min(10, sorted.length))
          }
        }
      }
    }

    // SECTION I: Challenges
    const challenges: ChallengeItem[] = generateDemoChallenges(
      skillsDetail.map(s => ({ name: s.name, level: s.level, overallScore: s.overallScore }))
    )

    // Check for real challenge data
    const realChallenges = await db.userChallenge.findMany({
      where: { userId },
      include: { challenge: true },
    })
    if (realChallenges.length > 0) {
      // Map real challenges into the response
      for (const rc of realChallenges) {
        const existingIdx = challenges.findIndex(c => c.id === rc.challengeId)
        if (existingIdx >= 0) {
          challenges[existingIdx].progress = rc.progress
          challenges[existingIdx].status = rc.completed ? 'completed' : 'available'
          challenges[existingIdx].completedAt = rc.completedAt?.toISOString() || null
        }
      }
    }

    // Persist computed scores to UserSkill records (upsert)
    for (const [skillId, scores] of skillScores) {
      try {
        await db.userSkill.upsert({
          where: { userId_skillId: { userId, skillId } },
          create: {
            userId,
            skillId,
            lessonScore: scores.lessonScore,
            quizScore: scores.quizScore,
            assignmentScore: scores.assignmentScore,
            tutorSignalScore: scores.tutorSignalScore,
            certBonus: scores.certBonus,
            overallScore: scores.overallScore,
            level: scores.level.toLowerCase(),
            evidenceCount: scores.evidenceCount,
            isVerified: scores.certBonus > 0,
            verifiedBy: scores.certBonus > 0 ? scores.sourceCourses[0] || null : null,
            lastUpdated: new Date(),
            lastPracticed: new Date(),
          },
          update: {
            lessonScore: scores.lessonScore,
            quizScore: scores.quizScore,
            assignmentScore: scores.assignmentScore,
            tutorSignalScore: scores.tutorSignalScore,
            certBonus: scores.certBonus,
            overallScore: scores.overallScore,
            level: scores.level.toLowerCase(),
            evidenceCount: scores.evidenceCount,
            isVerified: scores.certBonus > 0,
            verifiedBy: scores.certBonus > 0 ? scores.sourceCourses[0] || null : null,
            lastUpdated: new Date(),
          },
        })
      } catch {
        // Skip if skill doesn't exist in DB (demo data)
      }
    }

    const response: SkillsApiResponse = {
      skillTitle,
      skillTitleDescription,
      closestCareerPath,
      nextLevelSkills,
      totalSkillsTracked,
      verifiedSkills,
      inProgressSkills,
      overallScore,
      scoreChange,
      skillRadar,
      skills: skillsDetail,
      skillHistory,
      careerPaths,
      comparisons,
      challenges,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Skills API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skills data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ==================== POST HANDLER — SKILL RECALCULATION ====================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required in the request body' }, { status: 400 })
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure skills are seeded
    await ensureSkillsSeeded(userId)

    // Recalculate all skill scores
    const skillScores = await calculateSkillScores(userId)

    if (skillScores.size === 0) {
      return NextResponse.json({
        message: 'No skill data found to recalculate. The student may not have any enrollments or activity.',
        recalculated: 0,
      })
    }

    let recalculated = 0
    const now = new Date()

    for (const [skillId, scores] of skillScores) {
      // Apply decay: reduce score by up to 30% if lastPracticed > 60 days ago
      let existingUserSkill = await db.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId } },
      })

      let decayMultiplier = 1.0
      if (existingUserSkill) {
        const daysSincePractice = Math.floor(
          (now.getTime() - new Date(existingUserSkill.lastPracticed).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSincePractice > 60) {
          // Decay: up to 30% reduction, proportional to days beyond 60
          const decayDays = Math.min(daysSincePractice - 60, 180) // cap at 180 extra days
          decayMultiplier = 1.0 - (0.30 * (decayDays / 180))
        }
      }

      const decayedLessonScore = scores.lessonScore * decayMultiplier
      const decayedQuizScore = scores.quizScore * decayMultiplier
      const decayedAssignmentScore = scores.assignmentScore * decayMultiplier
      const decayedTutorSignalScore = scores.tutorSignalScore * decayMultiplier
      // Cert bonus doesn't decay
      const decayedOverallScore = computeOverallScore(
        decayedLessonScore,
        decayedQuizScore,
        decayedAssignmentScore,
        decayedTutorSignalScore,
        scores.certBonus
      )
      const decayedLevel = scoreToLevel(decayedOverallScore)

      // Upsert UserSkill
      try {
        const upserted = await db.userSkill.upsert({
          where: { userId_skillId: { userId, skillId } },
          create: {
            userId,
            skillId,
            lessonScore: Math.round(decayedLessonScore * 10) / 10,
            quizScore: Math.round(decayedQuizScore * 10) / 10,
            assignmentScore: Math.round(decayedAssignmentScore * 10) / 10,
            tutorSignalScore: Math.round(decayedTutorSignalScore),
            certBonus: scores.certBonus,
            overallScore: decayedOverallScore,
            level: decayedLevel.toLowerCase(),
            evidenceCount: scores.evidenceCount,
            isVerified: scores.certBonus > 0,
            verifiedBy: scores.certBonus > 0 ? scores.sourceCourses[0] || null : null,
            lastUpdated: now,
            lastPracticed: now,
            xpEarned: Math.round(decayedOverallScore / 10), // 1 XP per 10 score points
          },
          update: {
            lessonScore: Math.round(decayedLessonScore * 10) / 10,
            quizScore: Math.round(decayedQuizScore * 10) / 10,
            assignmentScore: Math.round(decayedAssignmentScore * 10) / 10,
            tutorSignalScore: Math.round(decayedTutorSignalScore),
            certBonus: scores.certBonus,
            overallScore: decayedOverallScore,
            level: decayedLevel.toLowerCase(),
            evidenceCount: scores.evidenceCount,
            isVerified: scores.certBonus > 0,
            verifiedBy: scores.certBonus > 0 ? scores.sourceCourses[0] || null : null,
            lastUpdated: now,
            xpEarned: Math.round(decayedOverallScore / 10),
          },
        })

        // Log to StudentSkillHistory
        const previousScore = existingUserSkill?.overallScore || 0
        const scoreDiff = decayedOverallScore - previousScore
        let eventDesc: string | null = 'Daily recalculation'
        if (Math.abs(scoreDiff) > 5) {
          eventDesc = scoreDiff > 0 ? 'Score improved' : 'Score decayed'
        }

        await db.studentSkillHistory.create({
          data: {
            userId,
            skillId,
            userSkillId: upserted.id,
            score: decayedOverallScore,
            level: decayedLevel.toLowerCase(),
            event: eventDesc,
            recordedAt: now,
          },
        })

        recalculated++
      } catch {
        // Skip if skill doesn't exist in DB
      }
    }

    return NextResponse.json({
      message: `Successfully recalculated ${recalculated} skills for user`,
      recalculated,
      timestamp: now.toISOString(),
      decayApplied: existingUserSkill => {
        // This is just a note that decay was checked
        return true
      },
    })
  } catch (error) {
    console.error('Skill recalculation error:', error)
    return NextResponse.json(
      { error: 'Failed to recalculate skills', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
