'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map,
  CheckCircle2,
  Circle,
  Lock,
  ArrowRight,
  Clock,
  Zap,
  Star,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface PathCourse {
  id: string
  title: string
  thumbnail: string | null
  status: 'completed' | 'in-progress' | 'locked'
  progress?: number
}

interface LearningPath {
  id: string
  title: string
  description: string
  duration: string
  courses: PathCourse[]
  totalXP: number
  gradient: string
  icon: React.ReactNode
  progress: number
}

const learningPaths: LearningPath[] = [
  {
    id: 'ib-science',
    title: 'IB Science Track',
    description: 'Master the core science subjects for IB examination success with a structured progression from mathematics through physics to computer science.',
    duration: '12-18 months',
    totalXP: 5000,
    gradient: 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10',
    icon: <Target className="size-5" />,
    progress: 45,
    courses: [
      { id: 'ib-math', title: 'IB Mathematics', thumbnail: '/math-thumbnail.png', status: 'completed', progress: 100 },
      { id: 'o-level-physics', title: 'O-Level Physics', thumbnail: '/physics-thumbnail.png', status: 'in-progress', progress: 35 },
      { id: 'a-level-cs', title: 'A-Level Computer Science', thumbnail: '/cs-thumbnail.png', status: 'locked' },
    ],
  },
  {
    id: 'tech-career',
    title: 'Tech Career Path',
    description: 'Launch your technology career with in-demand skills — from Python programming fundamentals to cloud certification and advanced specializations.',
    duration: '9-15 months',
    totalXP: 7500,
    gradient: 'from-amber-500/10 via-orange-500/10 to-red-500/10',
    icon: <TrendingUp className="size-5" />,
    progress: 20,
    courses: [
      { id: 'python-prog', title: 'Python Programming', thumbnail: '/cs-thumbnail.png', status: 'in-progress', progress: 60 },
      { id: 'aws-cloud', title: 'AWS Cloud Practitioner', thumbnail: '/math-thumbnail.png', status: 'locked' },
      { id: 'advanced-courses', title: 'Advanced Courses', thumbnail: null, status: 'locked' },
    ],
  },
  {
    id: 'global-education',
    title: 'Global Education',
    description: 'Prepare for international opportunities with English proficiency, globally recognized CS qualifications, and cloud expertise.',
    duration: '12-16 months',
    totalXP: 6000,
    gradient: 'from-violet-500/10 via-purple-500/10 to-fuchsia-500/10',
    icon: <Star className="size-5" />,
    progress: 0,
    courses: [
      { id: 'ielts-prep', title: 'IELTS Preparation', thumbnail: '/english-thumbnail.png', status: 'locked' },
      { id: 'a-level-cs-global', title: 'A-Level Computer Science', thumbnail: '/cs-thumbnail.png', status: 'locked' },
      { id: 'aws-cloud-global', title: 'AWS Cloud Practitioner', thumbnail: '/math-thumbnail.png', status: 'locked' },
    ],
  },
]

const recommendedPaths = [
  { id: 'ib-science', reason: 'Based on your IB Mathematics enrollment', match: 95 },
  { id: 'tech-career', reason: 'Popular among Python learners like you', match: 82 },
]

function CourseNode({ course, index, isLast, onClick }: { course: PathCourse; index: number; isLast: boolean; onClick: () => void }) {
  const statusConfig = {
    completed: { icon: <CheckCircle2 className="size-5 text-emerald-500" />, border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-600 dark:text-emerald-400', label: 'Completed' },
    'in-progress': { icon: <Circle className="size-5 text-amber-500" />, border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-600 dark:text-amber-400', label: 'In Progress' },
    locked: { icon: <Lock className="size-5 text-muted-foreground/50" />, border: 'border-border/50', bg: 'bg-muted/30', text: 'text-muted-foreground', label: 'Locked' },
  }

  const config = statusConfig[course.status]

  return (
    <div className="flex items-start gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.15, type: 'spring', stiffness: 200 }}
          className={cn(
            'flex size-10 items-center justify-center rounded-full border-2',
            config.border,
            config.bg
          )}
        >
          {config.icon}
        </motion.div>
        {!isLast && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            transition={{ delay: index * 0.15 + 0.1, duration: 0.4 }}
            className={cn(
              'w-0.5 min-h-[40px]',
              course.status === 'completed' ? 'bg-emerald-500/40' : 'bg-border'
            )}
          />
        )}
      </div>

      {/* Course Card */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.15 + 0.05 }}
        className={cn(
          'flex-1 rounded-xl border p-4 transition-all duration-200 mb-2',
          course.status !== 'locked' ? 'cursor-pointer hover:shadow-md hover:border-primary/30' : 'opacity-60',
          config.border
        )}
        onClick={course.status !== 'locked' ? onClick : undefined}
      >
        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          <div className="size-12 shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} className="size-full object-cover" />
            ) : (
              <BookOpen className="size-5 text-primary/60" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold truncate">{course.title}</h4>
              <Badge variant={course.status === 'completed' ? 'default' : course.status === 'in-progress' ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0">
                {config.label}
              </Badge>
            </div>
            {course.status === 'in-progress' && course.progress !== undefined && (
              <div className="mt-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span>{course.progress}% complete</span>
                </div>
                <Progress value={course.progress} className="h-1.5" />
              </div>
            )}
          </div>

          {course.status !== 'locked' && (
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </motion.div>
    </div>
  )
}

export function LearningPathsView() {
  const { setCurrentView, setSelectedCourse } = useAppStore()
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  const handleCourseClick = (courseId: string) => {
    // Navigate to course detail
    setSelectedCourse({ id: courseId } as any)
    setCurrentView('course-detail')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Map className="size-7 text-primary" />
            Learning Paths
          </h1>
          <p className="text-muted-foreground mt-1">
            Follow structured paths to achieve your learning goals
          </p>
        </div>
      </div>

      {/* Recommended for You */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="size-5 text-amber-500" />
            Recommended for You
          </CardTitle>
          <CardDescription>Paths tailored to your current enrollments and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {recommendedPaths.map((rec) => {
              const path = learningPaths.find((p) => p.id === rec.id)
              if (!path) return null
              return (
                <motion.button
                  key={rec.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedPath(rec.id)}
                  className="flex items-center gap-3 rounded-xl border border-primary/10 bg-background/80 p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-primary', path.gradient)}>
                    {path.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{path.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{rec.reason}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">
                    {rec.match}% match
                  </Badge>
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Learning Paths */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {learningPaths.map((path, pathIndex) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pathIndex * 0.1, duration: 0.3 }}
            >
              <Card className={cn(
                'overflow-hidden transition-all duration-300',
                selectedPath === path.id && 'ring-2 ring-primary/30'
              )}>
                {/* Path Header with Gradient */}
                <div className={cn('bg-gradient-to-r px-6 py-4', path.gradient)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background/80 text-primary shadow-sm">
                        {path.icon}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">{path.title}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">{path.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Clock className="size-3" />
                        {path.duration}
                      </Badge>
                      <Badge className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                        <Zap className="size-3" />
                        {path.totalXP} XP
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Path Progress</span>
                      <span className="font-medium">{path.progress}%</span>
                    </div>
                    <Progress value={path.progress} className="h-2" />
                  </div>
                </div>

                {/* Course Timeline */}
                <CardContent className="pt-4">
                  <div className="space-y-0">
                    {path.courses.map((course, idx) => (
                      <CourseNode
                        key={course.id}
                        course={course}
                        index={idx}
                        isLast={idx === path.courses.length - 1}
                        onClick={() => handleCourseClick(course.id)}
                      />
                    ))}
                  </div>

                  {/* Start/Continue Button */}
                  {path.progress < 100 && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => {
                          const nextCourse = path.courses.find((c) => c.status === 'in-progress' || c.status === 'locked')
                          if (nextCourse && nextCourse.status !== 'locked') {
                            handleCourseClick(nextCourse.id)
                          } else if (nextCourse?.status === 'locked') {
                            // Find first unlocked
                            const firstUnlocked = path.courses.find((c) => c.status !== 'locked')
                            if (firstUnlocked) handleCourseClick(firstUnlocked.id)
                          }
                        }}
                        className="gap-2"
                      >
                        {path.progress > 0 ? (
                          <>
                            Continue Path
                            <ArrowRight className="size-4" />
                          </>
                        ) : (
                          <>
                            Start Path
                            <ArrowRight className="size-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
