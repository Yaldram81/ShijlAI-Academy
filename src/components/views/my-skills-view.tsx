'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Award, Star, Target, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Sparkles, Shield, Download, Share2,
  Link, Lock, Zap, BarChart3, Radar, Clock, CheckCircle2,
  AlertTriangle, Circle, ArrowRight, Eye, EyeOff, Settings,
  Filter, SortAsc, BookOpen, Brain, Users, Briefcase,
  ChevronRight, ExternalLink, FileText, Play, RotateCcw,
  MessageSquare, Copy, Linkedin, ToggleLeft, ToggleRight,
  Activity, Flame, Medal, Gauge, LayoutGrid, List,
  RefreshCw, Info, X, Pencil
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip, TooltipContent, TooltipTrigger
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { ShijlAIBrand } from '@/components/ui/brand-text'

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

interface SubSkill {
  name: string
  score: number
  level: string
}

interface Evidence {
  source: string
  item: string
  contribution: string
  type: 'positive' | 'negative' | 'neutral'
}

interface Skill {
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
  evidence: Evidence[]
  aiInsight: string | null
  sourceCourses: string[]
  careerRelevance: string | null
}

interface SkillRadarPoint {
  name: string
  score: number
  target: number
}

interface TimelinePoint {
  date: string
  score: number
  level: string
  event: string | null
}

interface SkillHistory {
  skillId: string
  skillName: string
  points: TimelinePoint[]
}

interface CareerSkillGap {
  name: string
  requiredLevel: string
  requiredScore: number
  yourScore: number
  gap: 'none' | 'small' | 'medium' | 'large'
}

interface RecommendedCourse {
  title: string
  price: number
  duration: string
}

interface CareerPath {
  id: string
  title: string
  slug: string
  description: string | null
  icon: string | null
  readiness: number
  skills: CareerSkillGap[]
  aiAdvice: string | null
  recommendedCourses: RecommendedCourse[]
}

interface Comparison {
  skillName: string
  yourScore: number
  avgScore: number
  topTenScore: number
}

interface Challenge {
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
  skillRadar: SkillRadarPoint[]
  skills: Skill[]
  skillHistory: SkillHistory[]
  careerPaths: CareerPath[]
  comparisons: Comparison[]
  challenges: Challenge[]
}

/* ═══════════════════════════════════════════════════════════
   DEMO DATA
   ═══════════════════════════════════════════════════════════ */

function getDemoData(): SkillsApiResponse {
  return {
    skillTitle: 'PYTHON PRACTITIONER',
    skillTitleDescription: 'You demonstrate solid Python fundamentals with growing expertise in data manipulation and backend development.',
    closestCareerPath: 'Junior Python Developer → Backend Developer',
    nextLevelSkills: ['Django Framework', 'REST API Design', 'Database Optimization'],
    totalSkillsTracked: 14,
    verifiedSkills: 4,
    inProgressSkills: 6,
    overallScore: 72,
    scoreChange: 5.3,
    skillRadar: [
      { name: 'Python', score: 82, target: 90 },
      { name: 'Data Analysis', score: 68, target: 85 },
      { name: 'SQL', score: 55, target: 75 },
      { name: 'Problem Solving', score: 78, target: 80 },
      { name: 'Git', score: 45, target: 70 },
      { name: 'Communication', score: 85, target: 80 },
      { name: 'JavaScript', score: 30, target: 60 },
      { name: 'System Design', score: 20, target: 50 },
    ],
    skills: [
      {
        id: 's1', name: 'Python', slug: 'python', category: 'Technical',
        icon: '🐍', overallScore: 82, level: 'Advanced', isVerified: true,
        verifiedBy: 'ShijlAI Academy', isGap: false, isRecommended: false,
        lessonScore: 90, quizScore: 85, assignmentScore: 78, tutorSignalScore: 72, certBonus: 85,
        evidenceCount: 24,
        subSkills: [
          { name: 'Core Syntax', score: 95, level: 'Expert' },
          { name: 'OOP Concepts', score: 80, level: 'Advanced' },
          { name: 'Error Handling', score: 75, level: 'Advanced' },
          { name: 'File I/O', score: 82, level: 'Advanced' },
        ],
        evidence: [
          { source: 'Course', item: 'Python Fundamentals', contribution: '+15%', type: 'positive' },
          { source: 'Quiz', item: 'OOP Mastery Quiz', contribution: '+12%', type: 'positive' },
          { source: 'Assignment', item: 'Data Parser Project', contribution: '+10%', type: 'positive' },
          { source: 'AI Tutor', item: 'Active participation', contribution: '+5%', type: 'positive' },
        ],
        aiInsight: 'Your Python skills are strong! Focus on decorators and generators to reach Expert level. Consider building a real-world project using Flask or FastAPI.',
        sourceCourses: ['Python Fundamentals', 'Advanced Python Patterns'],
        careerRelevance: null,
      },
      {
        id: 's2', name: 'Data Analysis', slug: 'data-analysis', category: 'Technical',
        icon: '📊', overallScore: 68, level: 'Intermediate', isVerified: false,
        verifiedBy: null, isGap: false, isRecommended: false,
        lessonScore: 72, quizScore: 65, assignmentScore: 70, tutorSignalScore: 60, certBonus: 0,
        evidenceCount: 15,
        subSkills: [
          { name: 'Pandas', score: 75, level: 'Advanced' },
          { name: 'NumPy', score: 68, level: 'Intermediate' },
          { name: 'Data Visualization', score: 55, level: 'Intermediate' },
          { name: 'Statistics', score: 60, level: 'Intermediate' },
        ],
        evidence: [
          { source: 'Course', item: 'Data Analysis with Python', contribution: '+18%', type: 'positive' },
          { source: 'Quiz', item: 'Pandas Basics Quiz', contribution: '+10%', type: 'positive' },
          { source: 'Assignment', item: 'Missing — EDA Project', contribution: '-8%', type: 'negative' },
        ],
        aiInsight: 'You\'re making good progress in data analysis. Complete the EDA project assignment to boost your score. Try the Matplotlib deep-dive course.',
        sourceCourses: ['Data Analysis with Python'],
        careerRelevance: null,
      },
      {
        id: 's3', name: 'Problem Solving', slug: 'problem-solving', category: 'Soft Skills',
        icon: '🧩', overallScore: 78, level: 'Advanced', isVerified: true,
        verifiedBy: 'Algorithm Challenge Board', isGap: false, isRecommended: false,
        lessonScore: 70, quizScore: 88, assignmentScore: 82, tutorSignalScore: 65, certBonus: 0,
        evidenceCount: 18,
        subSkills: [
          { name: 'Algorithm Design', score: 85, level: 'Advanced' },
          { name: 'Pattern Recognition', score: 78, level: 'Advanced' },
          { name: 'Debugging', score: 72, level: 'Intermediate' },
        ],
        evidence: [
          { source: 'Quiz', item: 'Algorithm Challenge #12', contribution: '+14%', type: 'positive' },
          { source: 'Assignment', item: 'Sorting Algorithm Implementation', contribution: '+12%', type: 'positive' },
        ],
        aiInsight: 'Your problem-solving ability is above average. Practice more dynamic programming problems to sharpen your algorithmic thinking.',
        sourceCourses: ['Algorithm Fundamentals'],
        careerRelevance: null,
      },
      {
        id: 's4', name: 'Communication', slug: 'communication', category: 'Soft Skills',
        icon: '💬', overallScore: 85, level: 'Advanced', isVerified: false,
        verifiedBy: null, isGap: false, isRecommended: false,
        lessonScore: 80, quizScore: 88, assignmentScore: 90, tutorSignalScore: 82, certBonus: 0,
        evidenceCount: 10,
        subSkills: [
          { name: 'Written Communication', score: 90, level: 'Expert' },
          { name: 'Presentation', score: 80, level: 'Advanced' },
          { name: 'Code Documentation', score: 85, level: 'Advanced' },
        ],
        evidence: [
          { source: 'Assignment', item: 'Technical Documentation Project', contribution: '+18%', type: 'positive' },
          { source: 'AI Tutor', item: 'Clear question formulation', contribution: '+8%', type: 'positive' },
        ],
        aiInsight: 'Excellent communication skills! Consider writing technical blog posts to further enhance your profile.',
        sourceCourses: ['Technical Writing'],
        careerRelevance: null,
      },
      {
        id: 's5', name: 'SQL', slug: 'sql', category: 'Technical',
        icon: '🗃️', overallScore: 55, level: 'Intermediate', isVerified: false,
        verifiedBy: null, isGap: true, isRecommended: false,
        lessonScore: 60, quizScore: 50, assignmentScore: 55, tutorSignalScore: 48, certBonus: 0,
        evidenceCount: 8,
        subSkills: [
          { name: 'Basic Queries', score: 72, level: 'Advanced' },
          { name: 'Joins', score: 50, level: 'Intermediate' },
          { name: 'Subqueries', score: 40, level: 'Beginner' },
          { name: 'Optimization', score: 30, level: 'Beginner' },
        ],
        evidence: [
          { source: 'Course', item: 'SQL Basics', contribution: '+12%', type: 'positive' },
          { source: 'Quiz', item: 'Join Operations Quiz', contribution: '-5%', type: 'negative' },
        ],
        aiInsight: 'SQL is a gap area for your target career path. Focus on JOINs and subqueries — these are essential for backend development roles.',
        sourceCourses: ['SQL Fundamentals'],
        careerRelevance: 'Essential for Backend Developer career path',
      },
      {
        id: 's6', name: 'Git & Version Control', slug: 'git', category: 'Tools',
        icon: '🔀', overallScore: 45, level: 'Beginner', isVerified: false,
        verifiedBy: null, isGap: true, isRecommended: false,
        lessonScore: 50, quizScore: 40, assignmentScore: 35, tutorSignalScore: 48, certBonus: 0,
        evidenceCount: 5,
        subSkills: [
          { name: 'Basic Commands', score: 60, level: 'Intermediate' },
          { name: 'Branching', score: 35, level: 'Beginner' },
          { name: 'Merge Conflicts', score: 20, level: 'Beginner' },
        ],
        evidence: [
          { source: 'Course', item: 'Git Essentials', contribution: '+10%', type: 'positive' },
          { source: 'Quiz', item: 'Branching Quiz', contribution: '-5%', type: 'negative' },
        ],
        aiInsight: 'Git is critical for any developer role. Practice branching and resolving merge conflicts to improve quickly.',
        sourceCourses: ['Git Essentials'],
        careerRelevance: 'Required for all software development roles',
      },
      {
        id: 's7', name: 'JavaScript', slug: 'javascript', category: 'Technical',
        icon: '⚡', overallScore: 30, level: 'Beginner', isVerified: false,
        verifiedBy: null, isGap: false, isRecommended: true,
        lessonScore: 25, quizScore: 35, assignmentScore: 20, tutorSignalScore: 30, certBonus: 0,
        evidenceCount: 3,
        subSkills: [
          { name: 'Core Syntax', score: 40, level: 'Beginner' },
          { name: 'DOM Manipulation', score: 25, level: 'Beginner' },
          { name: 'Async/Await', score: 15, level: 'Beginner' },
        ],
        evidence: [
          { source: 'Course', item: 'JS Quick Start', contribution: '+8%', type: 'positive' },
        ],
        aiInsight: 'JavaScript is recommended based on your Python background — many full-stack roles require both. Start with core syntax and async patterns.',
        sourceCourses: ['JavaScript Quick Start'],
        careerRelevance: null,
      },
      {
        id: 's8', name: 'System Design', slug: 'system-design', category: 'Technical',
        icon: '🏗️', overallScore: 20, level: 'Beginner', isVerified: false,
        verifiedBy: null, isGap: false, isRecommended: true,
        lessonScore: 15, quizScore: 20, assignmentScore: 10, tutorSignalScore: 25, certBonus: 0,
        evidenceCount: 2,
        subSkills: [
          { name: 'Architecture Patterns', score: 20, level: 'Beginner' },
          { name: 'Scalability', score: 15, level: 'Beginner' },
        ],
        evidence: [
          { source: 'AI Tutor', item: 'Discussed microservices', contribution: '+5%', type: 'neutral' },
        ],
        aiInsight: 'System design becomes important as you advance to senior roles. Start learning about common architecture patterns and how web applications scale.',
        sourceCourses: [],
        careerRelevance: null,
      },
      {
        id: 's9', name: 'Docker', slug: 'docker', category: 'Tools',
        icon: '🐳', overallScore: 10, level: 'Not Started', isVerified: false,
        verifiedBy: null, isGap: false, isRecommended: true,
        lessonScore: 0, quizScore: 0, assignmentScore: 0, tutorSignalScore: 0, certBonus: 0,
        evidenceCount: 0,
        subSkills: [],
        evidence: [],
        aiInsight: 'Docker is essential for modern development workflows. It pairs well with your Python backend skills and is highly valued by employers.',
        sourceCourses: [],
        careerRelevance: 'Recommended for Backend Developer career path',
      },
      {
        id: 's10', name: 'React', slug: 'react', category: 'Technical',
        icon: '⚛️', overallScore: 15, level: 'Beginner', isVerified: false,
        verifiedBy: null, isGap: false, isRecommended: true,
        lessonScore: 10, quizScore: 20, assignmentScore: 5, tutorSignalScore: 15, certBonus: 0,
        evidenceCount: 2,
        subSkills: [
          { name: 'Components', score: 20, level: 'Beginner' },
          { name: 'State Management', score: 10, level: 'Beginner' },
        ],
        evidence: [
          { source: 'Course', item: 'React Basics Intro', contribution: '+5%', type: 'neutral' },
        ],
        aiInsight: 'Learning React alongside Python opens up full-stack opportunities. Your JavaScript knowledge will help here.',
        sourceCourses: ['React Basics Intro'],
        careerRelevance: null,
      },
      {
        id: 's11', name: 'Machine Learning', slug: 'ml', category: 'Technical',
        icon: '🤖', overallScore: 35, level: 'Beginner', isVerified: false,
        verifiedBy: null, isGap: false, isRecommended: false,
        lessonScore: 40, quizScore: 30, assignmentScore: 25, tutorSignalScore: 35, certBonus: 0,
        evidenceCount: 6,
        subSkills: [
          { name: 'Supervised Learning', score: 40, level: 'Beginner' },
          { name: 'Model Evaluation', score: 30, level: 'Beginner' },
          { name: 'Feature Engineering', score: 25, level: 'Beginner' },
        ],
        evidence: [
          { source: 'Course', item: 'Intro to ML', contribution: '+12%', type: 'positive' },
          { source: 'Quiz', item: 'ML Basics Quiz', contribution: '+5%', type: 'neutral' },
        ],
        aiInsight: 'ML complements your data analysis skills well. Focus on understanding model evaluation metrics and practice with real datasets.',
        sourceCourses: ['Intro to Machine Learning'],
        careerRelevance: null,
      },
      {
        id: 's12', name: 'Critical Thinking', slug: 'critical-thinking', category: 'Soft Skills',
        icon: '💡', overallScore: 90, level: 'Expert', isVerified: true,
        verifiedBy: 'Assessment Board', isGap: false, isRecommended: false,
        lessonScore: 85, quizScore: 95, assignmentScore: 92, tutorSignalScore: 88, certBonus: 90,
        evidenceCount: 30,
        subSkills: [
          { name: 'Logical Reasoning', score: 95, level: 'Expert' },
          { name: 'Analysis', score: 88, level: 'Advanced' },
          { name: 'Evaluation', score: 90, level: 'Expert' },
        ],
        evidence: [
          { source: 'Quiz', item: 'Logic Challenge', contribution: '+20%', type: 'positive' },
          { source: 'Assignment', item: 'Research Paper Review', contribution: '+15%', type: 'positive' },
          { source: 'Certificate', item: 'Critical Thinking Certified', contribution: '+10%', type: 'positive' },
        ],
        aiInsight: 'Outstanding critical thinking skills! You consistently demonstrate high-level analysis and logical reasoning.',
        sourceCourses: ['Critical Thinking Mastery'],
        careerRelevance: null,
      },
      {
        id: 's13', name: 'Teamwork', slug: 'teamwork', category: 'Soft Skills',
        icon: '🤝', overallScore: 75, level: 'Advanced', isVerified: true,
        verifiedBy: 'Peer Review System', isGap: false, isRecommended: false,
        lessonScore: 70, quizScore: 80, assignmentScore: 78, tutorSignalScore: 72, certBonus: 0,
        evidenceCount: 12,
        subSkills: [
          { name: 'Collaboration', score: 80, level: 'Advanced' },
          { name: 'Conflict Resolution', score: 65, level: 'Intermediate' },
          { name: 'Mentoring', score: 78, level: 'Advanced' },
        ],
        evidence: [
          { source: 'Assignment', item: 'Group Project Lead', contribution: '+15%', type: 'positive' },
          { source: 'AI Tutor', item: 'Peer interactions', contribution: '+8%', type: 'positive' },
        ],
        aiInsight: 'Good teamwork skills! Focus on developing conflict resolution abilities to round out your collaboration profile.',
        sourceCourses: ['Team Dynamics'],
        careerRelevance: null,
      },
      {
        id: 's14', name: 'VS Code', slug: 'vscode', category: 'Tools',
        icon: '💻', overallScore: 60, level: 'Intermediate', isVerified: false,
        verifiedBy: null, isGap: false, isRecommended: false,
        lessonScore: 65, quizScore: 55, assignmentScore: 58, tutorSignalScore: 62, certBonus: 0,
        evidenceCount: 7,
        subSkills: [
          { name: 'Editor Features', score: 75, level: 'Advanced' },
          { name: 'Extensions', score: 50, level: 'Intermediate' },
          { name: 'Debugging', score: 45, level: 'Intermediate' },
        ],
        evidence: [
          { source: 'Course', item: 'VS Code Power User', contribution: '+12%', type: 'positive' },
          { source: 'AI Tutor', item: 'Debugging sessions', contribution: '+8%', type: 'positive' },
        ],
        aiInsight: 'You\'re comfortable with VS Code basics. Learn keyboard shortcuts and debugging workflows to boost your productivity.',
        sourceCourses: ['VS Code Power User'],
        careerRelevance: null,
      },
    ],
    skillHistory: [
      {
        skillId: 's1', skillName: 'Python',
        points: [
          { date: '2025-01-15', score: 45, level: 'Intermediate', event: 'Completed Python Fundamentals' },
          { date: '2025-02-10', score: 58, level: 'Intermediate', event: 'Passed OOP Quiz' },
          { date: '2025-03-05', score: 65, level: 'Intermediate', event: 'Completed Data Parser Project' },
          { date: '2025-04-01', score: 72, level: 'Advanced', event: 'Level Up!' },
          { date: '2025-05-15', score: 78, level: 'Advanced', event: 'AI Tutor Session' },
          { date: '2025-06-01', score: 82, level: 'Advanced', event: 'Verified by ShijlAI Academy' },
        ],
      },
      {
        skillId: 's2', skillName: 'Data Analysis',
        points: [
          { date: '2025-02-01', score: 30, level: 'Beginner', event: 'Started Data Analysis course' },
          { date: '2025-03-15', score: 48, level: 'Beginner', event: 'Pandas Quiz Passed' },
          { date: '2025-04-20', score: 55, level: 'Intermediate', event: 'Level Up!' },
          { date: '2025-05-25', score: 62, level: 'Intermediate', event: 'NumPy Assignment' },
          { date: '2025-06-01', score: 68, level: 'Intermediate', event: null },
        ],
      },
      {
        skillId: 's5', skillName: 'SQL',
        points: [
          { date: '2025-03-01', score: 20, level: 'Beginner', event: 'Started SQL course' },
          { date: '2025-04-10', score: 38, level: 'Beginner', event: 'Basic Queries Quiz' },
          { date: '2025-05-20', score: 48, level: 'Intermediate', event: 'Level Up!' },
          { date: '2025-06-01', score: 55, level: 'Intermediate', event: null },
        ],
      },
    ],
    careerPaths: [
      {
        id: 'cp1', title: 'Backend Developer', slug: 'backend-developer',
        description: 'Build server-side applications, APIs, and microservices using Python and related frameworks.',
        icon: '🖥️', readiness: 65,
        skills: [
          { name: 'Python', requiredLevel: 'Advanced', requiredScore: 80, yourScore: 82, gap: 'none' },
          { name: 'SQL', requiredLevel: 'Advanced', requiredScore: 75, yourScore: 55, gap: 'medium' },
          { name: 'Git', requiredLevel: 'Intermediate', requiredScore: 60, yourScore: 45, gap: 'small' },
          { name: 'Docker', requiredLevel: 'Intermediate', requiredScore: 50, yourScore: 10, gap: 'large' },
          { name: 'System Design', requiredLevel: 'Intermediate', requiredScore: 50, yourScore: 20, gap: 'large' },
          { name: 'REST APIs', requiredLevel: 'Intermediate', requiredScore: 60, yourScore: 0, gap: 'large' },
        ],
        aiAdvice: 'You have a strong Python foundation for backend development. Focus on SQL (JOINs and optimization) and learn Docker basics. REST API design should be your next priority after SQL.',
        recommendedCourses: [
          { title: 'SQL Mastery: From Joins to Optimization', price: 29.99, duration: '12 hours' },
          { title: 'Docker for Python Developers', price: 19.99, duration: '8 hours' },
          { title: 'REST API Design with FastAPI', price: 34.99, duration: '15 hours' },
        ],
      },
      {
        id: 'cp2', title: 'Data Scientist', slug: 'data-scientist',
        description: 'Analyze data, build ML models, and derive insights to drive business decisions.',
        icon: '📈', readiness: 52,
        skills: [
          { name: 'Python', requiredLevel: 'Advanced', requiredScore: 80, yourScore: 82, gap: 'none' },
          { name: 'Data Analysis', requiredLevel: 'Advanced', requiredScore: 75, yourScore: 68, gap: 'small' },
          { name: 'Machine Learning', requiredLevel: 'Intermediate', requiredScore: 60, yourScore: 35, gap: 'medium' },
          { name: 'SQL', requiredLevel: 'Advanced', requiredScore: 75, yourScore: 55, gap: 'medium' },
          { name: 'Statistics', requiredLevel: 'Intermediate', requiredScore: 60, yourScore: 40, gap: 'medium' },
        ],
        aiAdvice: 'Your Python and data analysis skills provide a good foundation. Strengthen your statistics knowledge and complete ML courses to become competitive for data science roles.',
        recommendedCourses: [
          { title: 'Statistics for Data Science', price: 24.99, duration: '10 hours' },
          { title: 'ML Engineering with Python', price: 39.99, duration: '20 hours' },
        ],
      },
      {
        id: 'cp3', title: 'Full-Stack Developer', slug: 'fullstack-developer',
        description: 'Build end-to-end web applications combining frontend and backend skills.',
        icon: '🌐', readiness: 38,
        skills: [
          { name: 'Python', requiredLevel: 'Advanced', requiredScore: 80, yourScore: 82, gap: 'none' },
          { name: 'JavaScript', requiredLevel: 'Advanced', requiredScore: 75, yourScore: 30, gap: 'large' },
          { name: 'React', requiredLevel: 'Intermediate', requiredScore: 60, yourScore: 15, gap: 'large' },
          { name: 'SQL', requiredLevel: 'Intermediate', requiredScore: 60, yourScore: 55, gap: 'small' },
          { name: 'Git', requiredLevel: 'Advanced', requiredScore: 70, yourScore: 45, gap: 'medium' },
          { name: 'Docker', requiredLevel: 'Intermediate', requiredScore: 50, yourScore: 10, gap: 'large' },
        ],
        aiAdvice: 'Full-stack requires broad skills. Your Python is strong, but JavaScript and frontend frameworks need significant investment. Consider backend-first, then expand to frontend.',
        recommendedCourses: [
          { title: 'Modern JavaScript Complete Guide', price: 29.99, duration: '18 hours' },
          { title: 'React from Scratch', price: 34.99, duration: '16 hours' },
        ],
      },
    ],
    comparisons: [
      { skillName: 'Python', yourScore: 82, avgScore: 65, topTenScore: 95 },
      { skillName: 'Data Analysis', yourScore: 68, avgScore: 58, topTenScore: 90 },
      { skillName: 'SQL', yourScore: 55, avgScore: 62, topTenScore: 88 },
      { skillName: 'Problem Solving', yourScore: 78, avgScore: 60, topTenScore: 92 },
      { skillName: 'Git', yourScore: 45, avgScore: 55, topTenScore: 85 },
      { skillName: 'Communication', yourScore: 85, avgScore: 68, topTenScore: 95 },
      { skillName: 'JavaScript', yourScore: 30, avgScore: 50, topTenScore: 88 },
      { skillName: 'Machine Learning', yourScore: 35, avgScore: 45, topTenScore: 92 },
    ],
    challenges: [
      {
        id: 'ch1', title: 'Python Sprint Challenge', description: 'Complete 10 Python coding challenges in 30 minutes. Tests core syntax, data structures, and algorithmic thinking.',
        xpReward: 500, badge: '🐍 Python Sprinter', difficulty: 3, status: 'available',
        requiredLevel: 'Intermediate', progress: 0, bestTime: null, completedAt: null,
      },
      {
        id: 'ch2', title: 'SQL Query Master', description: 'Write optimized SQL queries for 5 real-world scenarios including JOINs, subqueries, and aggregations.',
        xpReward: 750, badge: '🗃️ SQL Master', difficulty: 4, status: 'locked',
        requiredLevel: 'Advanced', progress: 55, bestTime: null, completedAt: null,
      },
      {
        id: 'ch3', title: 'Data Viz Wizard', description: 'Create insightful visualizations from a messy dataset using Python visualization libraries.',
        xpReward: 400, badge: '📊 Viz Wizard', difficulty: 2, status: 'available',
        requiredLevel: 'Beginner', progress: 0, bestTime: null, completedAt: null,
      },
      {
        id: 'ch4', title: 'Bug Hunter', description: 'Find and fix bugs in 8 Python code snippets. Tests debugging and code reading skills.',
        xpReward: 350, badge: '🐛 Bug Hunter', difficulty: 2, status: 'completed',
        requiredLevel: 'Beginner', progress: 100, bestTime: '12:34', completedAt: '2025-05-20',
      },
      {
        id: 'ch5', title: 'Algorithm Arena', description: 'Solve 5 algorithmic problems of increasing difficulty within the time limit.',
        xpReward: 1000, badge: '🏆 Algorithm Champion', difficulty: 5, status: 'locked',
        requiredLevel: 'Expert', progress: 20, bestTime: null, completedAt: null,
      },
      {
        id: 'ch6', title: 'Documentation Pro', description: 'Write clear, comprehensive documentation for an undocumented Python codebase.',
        xpReward: 300, badge: '📝 Doc Pro', difficulty: 1, status: 'completed',
        requiredLevel: 'Beginner', progress: 100, bestTime: '25:10', completedAt: '2025-04-15',
      },
    ],
  }
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

const levelColors: Record<string, { bg: string; text: string; border: string; bar: string; icon: string }> = {
  'Expert': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', bar: 'bg-emerald-500', icon: 'text-emerald-500' },
  'Advanced': { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', bar: 'bg-blue-500', icon: 'text-blue-500' },
  'Intermediate': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', bar: 'bg-amber-500', icon: 'text-amber-500' },
  'Beginner': { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30', bar: 'bg-red-500', icon: 'text-red-500' },
  'Not Started': { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/30', bar: 'bg-slate-400', icon: 'text-slate-400' },
}

const levelIcons: Record<string, React.ReactNode> = {
  'Expert': <CheckCircle2 className="size-4 text-emerald-500" />,
  'Advanced': <Circle className="size-4 text-blue-500" />,
  'Intermediate': <Circle className="size-4 text-amber-500" />,
  'Beginner': <Circle className="size-4 text-red-500" />,
  'Not Started': <Circle className="size-4 text-slate-400" />,
}

function getLevelColor(level: string) {
  return levelColors[level] || levelColors['Not Started']
}

function getGapColor(gap: string) {
  switch (gap) {
    case 'none': return 'text-emerald-500'
    case 'small': return 'text-amber-500'
    case 'medium': return 'text-orange-500'
    case 'large': return 'text-red-500'
    default: return 'text-slate-500'
  }
}

function getGapBg(gap: string) {
  switch (gap) {
    case 'none': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    case 'small': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    case 'medium': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
    case 'large': return 'bg-red-500/10 text-red-600 dark:text-red-400'
    default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
  }
}

/* ═══════════════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════════════ */

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Hero skeleton */}
      <div className="rounded-2xl border border-border/40 bg-card p-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Radar skeleton */}
      <div className="rounded-2xl border border-border/40 bg-card p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex justify-center">
          <Skeleton className="h-64 w-64 rounded-full" />
        </div>
      </div>
      {/* Skill cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION A: HERO / SKILL IDENTITY CARD
   ═══════════════════════════════════════════════════════════ */

function HeroCard({ data }: { data: SkillsApiResponse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-border/40">
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <Trophy className="size-5" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                  {data.skillTitle}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mb-3 max-w-xl">
                {data.skillTitleDescription}
              </p>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Briefcase className="size-3.5 text-teal-500" />
                <span className="text-xs font-medium text-muted-foreground">Closest Career Path:</span>
                <span className="text-xs font-semibold text-foreground">{data.closestCareerPath}</span>
              </div>
              {data.nextLevelSkills.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Target className="size-3.5 text-amber-500" />
                  <span className="text-xs text-muted-foreground">To reach next level:</span>
                  {data.nextLevelSkills.map((skill, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] h-5 border-amber-500/30 text-amber-600 dark:text-amber-400">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stat boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <BarChart3 className="size-3.5 text-emerald-500" />
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Skills</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{data.totalSkillsTracked}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="size-3.5 text-blue-500" />
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Verified</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{data.verifiedSkills}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="size-3.5 text-amber-500" />
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{data.inProgressSkills}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/5 border border-teal-500/20 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Gauge className="size-3.5 text-teal-500" />
                <span className="text-[10px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider">Overall Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{data.overallScore}</p>
                <span className={cn(
                  'text-xs font-semibold flex items-center gap-0.5',
                  data.scoreChange >= 0 ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {data.scoreChange >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {data.scoreChange >= 0 ? '+' : ''}{data.scoreChange}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION B: SKILL RADAR / VISUAL MAP (SVG)
   ═══════════════════════════════════════════════════════════ */

function SkillRadarSection({ data }: { data: SkillsApiResponse }) {
  const [viewMode, setViewMode] = useState<'radar' | 'bar' | 'cards'>('radar')
  const radarData = data.skillRadar
  const size = 280
  const center = size / 2
  const maxRadius = 110
  const levels = 5

  const angleStep = (2 * Math.PI) / radarData.length

  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2
    const r = (value / 100) * maxRadius
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
  }

  const radarPath = radarData.map((d, i) => {
    const p = getPoint(i, d.score)
    return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  }).join(' ') + ' Z'

  const targetPath = radarData.map((d, i) => {
    const p = getPoint(i, d.target)
    return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  }).join(' ') + ' Z'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Radar className="size-5 text-teal-500" />
              <h2 className="text-lg font-semibold text-foreground">Skill Radar</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg bg-muted p-0.5">
                {(['radar', 'bar', 'cards'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
                      viewMode === mode
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {mode === 'radar' && <Radar className="size-3 inline mr-1" />}
                    {mode === 'bar' && <BarChart3 className="size-3 inline mr-1" />}
                    {mode === 'cards' && <LayoutGrid className="size-3 inline mr-1" />}
                    {mode}
                  </button>
                ))}
              </div>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                <Sparkles className="size-3 text-violet-500" />
                AI: Analyze Gaps
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'radar' && (
            <div className="flex flex-col items-center gap-4">
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
                {/* Grid rings */}
                {Array.from({ length: levels }, (_, l) => {
                  const r = ((l + 1) / levels) * maxRadius
                  const points = radarData.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2
                    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
                  }).join(' ')
                  return <polygon key={l} points={points} fill="none" stroke="currentColor" className="text-border/60" strokeWidth="0.5" />
                })}
                {/* Axes */}
                {radarData.map((_, i) => {
                  const angle = i * angleStep - Math.PI / 2
                  return (
                    <line
                      key={i}
                      x1={center} y1={center}
                      x2={center + maxRadius * Math.cos(angle)}
                      y2={center + maxRadius * Math.sin(angle)}
                      stroke="currentColor" className="text-border/40" strokeWidth="0.5"
                    />
                  )
                })}
                {/* Target shape */}
                <path d={targetPath} fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
                {/* Score shape */}
                <path d={radarPath} fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="2" />
                {/* Data points + labels */}
                {radarData.map((d, i) => {
                  const p = getPoint(i, d.score)
                  const labelAngle = i * angleStep - Math.PI / 2
                  const labelR = maxRadius + 28
                  const lx = center + labelR * Math.cos(labelAngle)
                  const ly = center + labelR * Math.sin(labelAngle)
                  return (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="3.5" fill="#10b981" stroke="white" strokeWidth="1.5" />
                      <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[10px] font-medium">
                        {d.name}
                      </text>
                    </g>
                  )
                })}
              </svg>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                  <span>Your Score</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-amber-500 rounded border-dashed" />
                  <span>Target</span>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'bar' && (
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-2">
              {radarData.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{d.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Target: {d.target}</span>
                      <span className={cn('font-semibold', d.score >= d.target ? 'text-emerald-500' : 'text-amber-500')}>
                        {d.score}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                    <div className="absolute inset-0 rounded-full bg-amber-500/20" style={{ width: `${d.target}%` }} />
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        d.score >= d.target ? 'bg-emerald-500' : 'bg-teal-500'
                      )}
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'cards' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto scrollbar-thin pr-2">
              {radarData.map((d, i) => {
                const pct = d.score
                const isAboveTarget = d.score >= d.target
                return (
                  <div key={i} className="rounded-xl border border-border/40 bg-muted/30 p-3 text-center">
                    <p className="text-xs font-medium text-foreground truncate">{d.name}</p>
                    <p className={cn('text-2xl font-bold mt-1', isAboveTarget ? 'text-emerald-500' : 'text-amber-500')}>
                      {pct}
                    </p>
                    <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', isAboveTarget ? 'bg-emerald-500' : 'bg-amber-500')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Target: {d.target}</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION C: FILTER TABS
   ═══════════════════════════════════════════════════════════ */

interface FilterState {
  category: string
  sort: string
  level: string
  showGapsOnly: boolean
}

function FilterBar({
  skills,
  filters,
  onFilterChange,
}: {
  skills: Skill[]
  filters: FilterState
  onFilterChange: (f: FilterState) => void
}) {
  const categories = useMemo(() => {
    const cats: Record<string, number> = { All: skills.length }
    skills.forEach(s => { cats[s.category] = (cats[s.category] || 0) + 1 })
    return cats
  }, [skills])

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {Object.entries(categories).map(([cat, count]) => (
          <button
            key={cat}
            onClick={() => onFilterChange({ ...filters, category: cat })}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-all border',
              filters.category === cat
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-accent hover:text-foreground'
            )}
          >
            {cat} ({count})
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Select value={filters.sort} onValueChange={v => onFilterChange({ ...filters, sort: v })}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SortAsc className="size-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="strongest">Strongest first</SelectItem>
            <SelectItem value="weakest">Weakest first</SelectItem>
            <SelectItem value="recent">Recently updated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.level} onValueChange={v => onFilterChange({ ...filters, level: v })}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="Expert">Expert</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Not Started">Not Started</SelectItem>
          </SelectContent>
        </Select>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={filters.showGapsOnly ? 'default' : 'outline'}
              className={cn(
                'h-8 gap-1.5 text-xs',
                filters.showGapsOnly && 'bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 border-red-500/30'
              )}
              onClick={() => onFilterChange({ ...filters, showGapsOnly: !filters.showGapsOnly })}
            >
              <AlertTriangle className="size-3" />
              Gaps only
            </Button>
          </TooltipTrigger>
          <TooltipContent>Show only skills with detected gaps</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION D: SKILL CARD (EXPANDABLE)
   ═══════════════════════════════════════════════════════════ */

function SkillCard({ skill, isExpanded, onToggle }: { skill: Skill; isExpanded: boolean; onToggle: () => void }) {
  const colors = getLevelColor(skill.level)

  return (
    <motion.div layout transition={{ duration: 0.2 }}>
      <Card className={cn(
        'border transition-all overflow-hidden',
        skill.isGap ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-border/40',
        skill.isRecommended && !skill.isGap && 'border-violet-500/30 bg-violet-500/[0.02]',
        skill.isVerified && 'border-emerald-500/30',
      )}>
        {/* Collapsed header */}
        <button
          onClick={onToggle}
          className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={cn('flex size-10 items-center justify-center rounded-xl text-lg shrink-0', colors.bg)}>
              {skill.icon || (skill.level === 'Not Started' ? '⚪' : skill.level === 'Expert' ? '✅' : skill.level === 'Advanced' ? '🔵' : skill.level === 'Intermediate' ? '🟡' : '🔴')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground text-sm">{skill.name}</span>
                <Badge variant="outline" className={cn('text-[10px] h-5', colors.bg, colors.text, colors.border)}>
                  {skill.level.toUpperCase()}
                </Badge>
                {skill.isVerified && (
                  <Badge className="text-[10px] h-5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="size-3 mr-0.5" /> Verified
                  </Badge>
                )}
                {skill.isGap && (
                  <Badge className="text-[10px] h-5 bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                    <AlertTriangle className="size-3 mr-0.5" /> Gap
                  </Badge>
                )}
                {skill.isRecommended && (
                  <Badge className="text-[10px] h-5 bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30">
                    <Sparkles className="size-3 mr-0.5" /> Recommended
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex-1 max-w-48 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', colors.bar)} style={{ width: `${skill.overallScore}%` }} />
                </div>
                <span className={cn('text-sm font-bold', colors.text)}>{skill.overallScore}%</span>
                {skill.careerRelevance && (
                  <span className="text-[10px] text-red-500 hidden sm:inline">{skill.careerRelevance}</span>
                )}
              </div>
            </div>
            <div className="shrink-0 ml-2">
              {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </div>
          </div>
        </button>

        {/* Expanded detail */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-0 space-y-4 border-t border-border/30">
                {/* Score Breakdown */}
                <div className="pt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Score Breakdown</h4>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Lessons watched', value: skill.lessonScore, weight: 20 },
                      { label: 'Quiz performance', value: skill.quizScore, weight: 35 },
                      { label: 'Assignments', value: skill.assignmentScore, weight: 30 },
                      { label: 'AI tutor signals', value: skill.tutorSignalScore, weight: 10 },
                      { label: 'Certificate bonus', value: skill.certBonus, weight: 5 },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground/60">weight: {item.weight}%</span>
                            <span className="font-medium text-foreground">{item.value}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn('h-full rounded-full', colors.bar)} style={{ width: `${item.value}%` }} />
                        </div>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Overall</span>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-bold', colors.text)}>{skill.overallScore}%</span>
                        <Badge variant="outline" className={cn('text-[10px] h-5', colors.bg, colors.text, colors.border)}>
                          {skill.level.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-skills */}
                {skill.subSkills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sub-skills</h4>
                    <div className="space-y-2">
                      {skill.subSkills.map((sub) => {
                        const subColors = getLevelColor(sub.level)
                        return (
                          <div key={sub.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-foreground">{sub.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5', subColors.bg, subColors.text, subColors.border)}>
                                  {sub.level}
                                </Badge>
                                <span className={cn('font-semibold', subColors.text)}>{sub.score}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={cn('h-full rounded-full', subColors.bar)} style={{ width: `${sub.score}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Evidence Trail */}
                {skill.evidence.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Evidence Trail</h4>
                    <div className="rounded-lg border border-border/30 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Source</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Item</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Contribution</th>
                          </tr>
                        </thead>
                        <tbody>
                          {skill.evidence.map((ev, i) => (
                            <tr key={i} className="border-t border-border/20">
                              <td className="px-3 py-2 text-foreground">{ev.source}</td>
                              <td className="px-3 py-2 text-foreground">{ev.item}</td>
                              <td className="px-3 py-2">
                                <span className={cn(
                                  'font-medium',
                                  ev.type === 'positive' ? 'text-emerald-500' : ev.type === 'negative' ? 'text-red-500' : 'text-muted-foreground'
                                )}>
                                  {ev.contribution}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* AI Insight */}
                {skill.aiInsight && (
                  <div className="rounded-xl bg-gradient-to-r from-violet-500/10 to-teal-500/5 border border-violet-500/20 p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="size-3.5 text-violet-500" />
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">AI Insight</span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">{skill.aiInsight}</p>
                  </div>
                )}

                {/* Career Relevance */}
                {skill.careerRelevance && (
                  <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="size-3.5 text-red-500" />
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">{skill.careerRelevance}</span>
                    </div>
                  </div>
                )}

                {/* Source courses */}
                {skill.sourceCourses.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <BookOpen className="size-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">From:</span>
                    {skill.sourceCourses.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] h-5">{c}</Badge>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                    <Play className="size-3" /> Revisit Lesson
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                    <RotateCcw className="size-3" /> Retake Quiz
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                    <MessageSquare className="size-3" /> Ask AI Tutor
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION E: SKILL TIMELINE / HISTORY (SVG LINE CHART)
   ═══════════════════════════════════════════════════════════ */

function SkillTimeline({ data }: { data: SkillsApiResponse }) {
  const [selectedSkill, setSelectedSkill] = useState(data.skillHistory[0]?.skillId || '')
  const [timeRange, setTimeRange] = useState<'6m' | '1y' | 'all'>('6m')

  const history = data.skillHistory.find(h => h.skillId === selectedSkill)
  const points = history?.points || []

  const filteredPoints = useMemo(() => {
    if (timeRange === 'all') return points
    const months = timeRange === '6m' ? 6 : 12
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - months)
    return points.filter(p => new Date(p.date) >= cutoff)
  }, [points, timeRange])

  const chartW = 600
  const chartH = 200
  const padX = 50
  const padY = 30
  const plotW = chartW - padX * 2
  const plotH = chartH - padY * 2

  const scaleX = (i: number) => padX + (filteredPoints.length > 1 ? (i / (filteredPoints.length - 1)) * plotW : plotW / 2)
  const scaleY = (v: number) => padY + plotH - (v / 100) * plotH

  const linePath = filteredPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p.score)}`).join(' ')
  const areaPath = linePath + ` L ${scaleX(filteredPoints.length - 1)} ${scaleY(0)} L ${scaleX(0)} ${scaleY(0)} Z`

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-foreground">Skill Timeline</h2>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.skillHistory.map(h => (
                    <SelectItem key={h.skillId} value={h.skillId}>{h.skillName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="inline-flex rounded-lg bg-muted p-0.5">
                {(['6m', '1y', 'all'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      'px-2.5 py-1 text-[10px] font-medium rounded-md transition-all uppercase',
                      timeRange === range
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {range === '6m' ? '6 Mo' : range === '1y' ? '1 Yr' : 'All'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPoints.length < 2 ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              Not enough data points for timeline
            </div>
          ) : (
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${chartW} ${chartH + 40}`} className="w-full min-w-[400px]" style={{ maxHeight: '280px' }}>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(v => (
                  <g key={v}>
                    <line x1={padX} y1={scaleY(v)} x2={chartW - padX} y2={scaleY(v)} stroke="currentColor" className="text-border/40" strokeWidth="0.5" />
                    <text x={padX - 8} y={scaleY(v)} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[9px]">{v}</text>
                  </g>
                ))}
                {/* Area fill */}
                <path d={areaPath} fill="url(#timelineGrad)" opacity="0.3" />
                <defs>
                  <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Line */}
                <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Points + events */}
                {filteredPoints.map((p, i) => (
                  <g key={i}>
                    <circle cx={scaleX(i)} cy={scaleY(p.score)} r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                    {p.event && (
                      <g>
                        <circle cx={scaleX(i)} cy={scaleY(p.score)} r="7" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                        <text
                          x={scaleX(i)}
                          y={scaleY(p.score) - 14}
                          textAnchor="middle"
                          className="fill-foreground text-[8px] font-medium"
                        >
                          {p.event.length > 25 ? p.event.slice(0, 25) + '…' : p.event}
                        </text>
                      </g>
                    )}
                    <text
                      x={scaleX(i)}
                      y={chartH - padY + 18}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[8px]"
                    >
                      {new Date(p.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION F: CAREER PATH MATCHER
   ═══════════════════════════════════════════════════════════ */

function CareerPathSection({ data }: { data: SkillsApiResponse }) {
  const [selectedPath, setSelectedPath] = useState(data.careerPaths[0]?.id || '')
  const path = data.careerPaths.find(p => p.id === selectedPath) || data.careerPaths[0]

  if (!path) return null

  const gapCounts = {
    none: path.skills.filter(s => s.gap === 'none').length,
    small: path.skills.filter(s => s.gap === 'small').length,
    medium: path.skills.filter(s => s.gap === 'medium').length,
    large: path.skills.filter(s => s.gap === 'large').length,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="size-5 text-teal-500" />
            <h2 className="text-lg font-semibold text-foreground">Career Path Matcher</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Career path selector */}
          <div className="flex flex-wrap gap-2">
            {data.careerPaths.map(cp => (
              <button
                key={cp.id}
                onClick={() => setSelectedPath(cp.id)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium transition-all border',
                  selectedPath === cp.id
                    ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30 shadow-sm'
                    : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-accent'
                )}
              >
                <span className="mr-1">{cp.icon}</span>
                {cp.title}
                <span className="ml-1.5 text-[10px] opacity-70">{cp.readiness}%</span>
              </button>
            ))}
          </div>

          {/* Selected career path */}
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{path.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{path.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{path.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Readiness</p>
                <p className="text-xl font-bold text-teal-500">{path.readiness}%</p>
              </div>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-3">
              <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all" style={{ width: `${path.readiness}%` }} />
            </div>
            <div className="flex gap-3 text-[10px]">
              <span className="text-emerald-500">✓ {gapCounts.none} met</span>
              <span className="text-amber-500">◐ {gapCounts.small} close</span>
              <span className="text-orange-500">◑ {gapCounts.medium} medium gap</span>
              <span className="text-red-500">○ {gapCounts.large} large gap</span>
            </div>
          </div>

          {/* Skills gap table */}
          <div className="rounded-lg border border-border/30 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Skill</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Required</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Your Level</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Gap</th>
                </tr>
              </thead>
              <tbody>
                {path.skills.map((s, i) => (
                  <tr key={i} className="border-t border-border/20">
                    <td className="px-3 py-2 font-medium text-foreground">{s.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{s.requiredLevel} ({s.requiredScore}%)</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn('h-full rounded-full', s.yourScore >= s.requiredScore ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${s.yourScore}%` }} />
                        </div>
                        <span className="text-foreground">{s.yourScore}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge className={cn('text-[9px] h-4 px-1.5 font-semibold', getGapBg(s.gap))}>
                        {s.gap === 'none' ? '✓ None' : s.gap === 'small' ? '◐ Small' : s.gap === 'medium' ? '◑ Medium' : '○ Large'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Career Advisor */}
          {path.aiAdvice && (
            <div className="rounded-xl bg-gradient-to-r from-violet-500/10 to-teal-500/5 border border-violet-500/20 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="size-4 text-violet-500" />
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">AI Career Advisor</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{path.aiAdvice}</p>
            </div>
          )}

          {/* Recommended Learning Order */}
          {path.recommendedCourses.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recommended Learning Order</h4>
              <div className="space-y-3">
                {path.recommendedCourses.map((course, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-border/30 bg-muted/20 p-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{course.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="size-3" /> {course.duration}</span>
                        <span>{course.price === 0 ? 'Free' : `$${course.price}`}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 shrink-0">
                      Start <ArrowRight className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other career paths */}
          {data.careerPaths.length > 1 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Other Career Paths You Could Match</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.careerPaths.filter(cp => cp.id !== selectedPath).map(cp => (
                  <button
                    key={cp.id}
                    onClick={() => setSelectedPath(cp.id)}
                    className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/20 p-3 hover:bg-muted/40 transition-colors text-left"
                  >
                    <span className="text-lg">{cp.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{cp.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-teal-500" style={{ width: `${cp.readiness}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-teal-500">{cp.readiness}%</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION G: SKILL COMPARISON
   ═══════════════════════════════════════════════════════════ */

function SkillComparison({ data }: { data: SkillsApiResponse }) {
  const [compareMode, setCompareMode] = useState<'peers' | 'jobs'>('peers')

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
    >
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-foreground">Skill Comparison</h2>
            </div>
            <div className="inline-flex rounded-lg bg-muted p-0.5">
              {(['peers', 'jobs'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setCompareMode(mode)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
                    compareMode === mode
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  vs. {mode === 'peers' ? 'Peers' : 'Jobs'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.comparisons.map((comp, i) => {
            const isAhead = comp.yourScore > comp.avgScore
            const isTopTen = comp.yourScore >= comp.topTenScore * 0.85
            const maxVal = Math.max(comp.yourScore, comp.avgScore, comp.topTenScore, 1)

            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{comp.skillName}</span>
                  {isTopTen ? (
                    <Badge className="text-[9px] h-4 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <Star className="size-3 mr-0.5" /> Top 10%!
                    </Badge>
                  ) : isAhead ? (
                    <Badge className="text-[9px] h-4 bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                      <TrendingUp className="size-3 mr-0.5" /> Ahead
                    </Badge>
                  ) : (
                    <Badge className="text-[9px] h-4 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      Below avg
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  {/* Your score */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-12 shrink-0">You</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(comp.yourScore / maxVal) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-500 w-8 text-right">{comp.yourScore}</span>
                  </div>
                  {/* Platform average */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-12 shrink-0">Avg</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500/60" style={{ width: `${(comp.avgScore / maxVal) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-amber-500 w-8 text-right">{comp.avgScore}</span>
                  </div>
                  {/* Top 10% */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-12 shrink-0">Top 10%</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500/40" style={{ width: `${(comp.topTenScore / maxVal) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-teal-500 w-8 text-right">{comp.topTenScore}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION H: SHAREABLE SKILL PROFILE
   ═══════════════════════════════════════════════════════════ */

function ShareableProfile({ data }: { data: SkillsApiResponse }) {
  const [profilePublic, setProfilePublic] = useState(true)
  const topSkills = [...data.skills].sort((a, b) => b.overallScore - a.overallScore).slice(0, 5)
  const userName = useAppStore(s => s.currentUser?.name) || 'Student'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="size-5 text-teal-500" />
              <h2 className="text-lg font-semibold text-foreground">Shareable Skill Profile</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{profilePublic ? 'Public' : 'Private'}</span>
              <button onClick={() => setProfilePublic(!profilePublic)} className="text-teal-500">
                {profilePublic ? <ToggleRight className="size-6" /> : <ToggleLeft className="size-6" />}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Profile card preview */}
          <div className="rounded-xl border border-border/40 bg-gradient-to-br from-card to-muted/30 p-5 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-lg">
                {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{userName}</h3>
                <p className="text-xs text-muted-foreground">{data.skillTitle}</p>
              </div>
            </div>

            <div className="space-y-2.5 mb-4">
              {topSkills.map((skill) => {
                const colors = getLevelColor(skill.level)
                return (
                  <div key={skill.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{skill.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-[10px] font-medium', colors.text)}>{skill.level}</span>
                        <span className={cn('font-bold', colors.text)}>{skill.overallScore}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full', colors.bar)} style={{ width: `${skill.overallScore}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-center gap-2 pt-3 border-t border-border/30">
              <Shield className="size-3.5 text-emerald-500" />
              <span className="text-[10px] font-medium text-muted-foreground">Verified by <ShijlAIBrand variant="compact" /></span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
              <Copy className="size-3" /> Copy Profile Link
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
              <Download className="size-3" /> Download as PDF
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
              <Linkedin className="size-3" /> Add to LinkedIn
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION I: SKILL CHALLENGES
   ═══════════════════════════════════════════════════════════ */

function SkillChallenges({ data }: { data: SkillsApiResponse }) {
  const available = data.challenges.filter(c => c.status === 'available')
  const completed = data.challenges.filter(c => c.status === 'completed')
  const locked = data.challenges.filter(c => c.status === 'locked')

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.45 }}
    >
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-foreground">Skill Challenges</h2>
            <Badge variant="outline" className="text-[10px] h-5">{data.challenges.length} total</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available */}
          {available.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Available</h4>
              <div className="space-y-2">
                {available.map(ch => (
                  <div key={ch.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{ch.title}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={cn('size-3', i < ch.difficulty ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30')} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ch.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="flex items-center gap-1 text-emerald-500"><Zap className="size-3" /> {ch.xpReward} XP</span>
                          {ch.badge && <span className="text-muted-foreground">{ch.badge}</span>}
                        </div>
                      </div>
                      <Button size="sm" className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 shrink-0">
                        <Play className="size-3" /> Start
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Completed</h4>
              <div className="space-y-2">
                {completed.map(ch => (
                  <div key={ch.id} className="rounded-xl border border-border/30 bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{ch.title}</span>
                          <Badge className="text-[9px] h-4 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="size-3 mr-0.5" /> Completed
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Zap className="size-3" /> {ch.xpReward} XP earned</span>
                          {ch.bestTime && <span className="flex items-center gap-1"><Clock className="size-3" /> Best: {ch.bestTime}</span>}
                          {ch.completedAt && <span>{new Date(ch.completedAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      {ch.badge && (
                        <div className="shrink-0 flex size-9 items-center justify-center rounded-full bg-amber-500/15 text-lg">
                          {ch.badge.split(' ')[0]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked */}
          {locked.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Locked</h4>
              <div className="space-y-2">
                {locked.map(ch => (
                  <div key={ch.id} className="rounded-xl border border-border/20 bg-muted/10 p-3 opacity-70">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{ch.title}</span>
                          <Badge variant="outline" className="text-[9px] h-4 gap-0.5">
                            <Lock className="size-3" /> Requires {ch.requiredLevel}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ch.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground"><Zap className="size-3" /> {ch.xpReward} XP</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-slate-400" style={{ width: `${ch.progress}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{ch.progress}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION J: SKILL SETTINGS
   ═══════════════════════════════════════════════════════════ */

function SkillSettings() {
  const [careerGoal, setCareerGoal] = useState('backend')
  const [showCourses, setShowCourses] = useState(true)
  const [showQuizzes, setShowQuizzes] = useState(true)
  const [showAssignments, setShowAssignments] = useState(true)
  const [showAITutor, setShowAITutor] = useState(true)
  const [profileVisibility, setProfileVisibility] = useState(true)
  const [notifyLevelUp, setNotifyLevelUp] = useState(true)
  const [notifyGapDetected, setNotifyGapDetected] = useState(true)
  const [notifyWeeklyReport, setNotifyWeeklyReport] = useState(false)
  const [skillDecay, setSkillDecay] = useState(true)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings className="size-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-foreground">Skill Settings</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Career Goal */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Career Goal</h4>
            <div className="space-y-2">
              {[
                { id: 'backend', label: 'Backend Developer', icon: '🖥️' },
                { id: 'data', label: 'Data Scientist', icon: '📈' },
                { id: 'fullstack', label: 'Full-Stack Developer', icon: '🌐' },
                { id: 'ml', label: 'ML Engineer', icon: '🤖' },
                { id: 'general', label: 'General Improvement', icon: '📚' },
              ].map(goal => (
                <label key={goal.id} className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all',
                  careerGoal === goal.id ? 'border-teal-500/30 bg-teal-500/5' : 'border-border/30 hover:bg-muted/30'
                )}>
                  <input
                    type="radio"
                    name="careerGoal"
                    value={goal.id}
                    checked={careerGoal === goal.id}
                    onChange={() => setCareerGoal(goal.id)}
                    className="accent-teal-500"
                  />
                  <span className="text-sm">{goal.icon}</span>
                  <span className="text-sm font-medium text-foreground">{goal.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Show skills from */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Show Skills From</h4>
            <div className="space-y-2">
              {[
                { label: 'Courses', checked: showCourses, onChange: setShowCourses },
                { label: 'Quizzes', checked: showQuizzes, onChange: setShowQuizzes },
                { label: 'Assignments', checked: showAssignments, onChange: setShowAssignments },
                { label: 'AI Tutor', checked: showAITutor, onChange: setShowAITutor },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={e => item.onChange(e.target.checked)}
                    className="accent-teal-500 rounded"
                  />
                  <span className="text-sm text-foreground">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Profile visibility */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Profile Visibility</h4>
            <label className="flex items-center gap-3 cursor-pointer">
              <button onClick={() => setProfileVisibility(!profileVisibility)} className="text-teal-500">
                {profileVisibility ? <ToggleRight className="size-6" /> : <ToggleLeft className="size-6" />}
              </button>
              <span className="text-sm text-foreground">{profileVisibility ? 'Public — Anyone can view your skill profile' : 'Private — Only you can see your skills'}</span>
            </label>
          </div>

          <Separator />

          {/* Notification preferences */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notifications</h4>
            <div className="space-y-2">
              {[
                { label: 'Skill level up', checked: notifyLevelUp, onChange: setNotifyLevelUp },
                { label: 'Gap detected', checked: notifyGapDetected, onChange: setNotifyGapDetected },
                { label: 'Weekly skill report', checked: notifyWeeklyReport, onChange: setNotifyWeeklyReport },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={e => item.onChange(e.target.checked)}
                    className="accent-teal-500 rounded"
                  />
                  <span className="text-sm text-foreground">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Skill decay */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Skill Decay</h4>
            <label className="flex items-center gap-3 cursor-pointer">
              <button onClick={() => setSkillDecay(!skillDecay)} className="text-teal-500">
                {skillDecay ? <ToggleRight className="size-6" /> : <ToggleLeft className="size-6" />}
              </button>
              <div>
                <span className="text-sm text-foreground">Enable skill decay tracking</span>
                <p className="text-xs text-muted-foreground mt-0.5">Skills not practiced for 7+ days will gradually decay (0.5% per day)</p>
              </div>
            </label>
          </div>

          <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT: MySkillsView
   ═══════════════════════════════════════════════════════════ */

export function MySkillsView() {
  const { currentUser } = useAppStore()
  const [data, setData] = useState<SkillsApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Skill card expansion state
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    category: 'All',
    sort: 'strongest',
    level: 'all',
    showGapsOnly: false,
  })

  // Active tab
  const [activeTab, setActiveTab] = useState('skills')

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const userId = currentUser?.id || 'demo'
      const res = await fetch(`/api/skills?userId=${userId}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        // Use demo data on API failure
        setData(getDemoData())
      }
    } catch {
      setData(getDemoData())
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    if (!data) return []
    let skills = [...data.skills]

    // Category filter
    if (filters.category !== 'All') {
      skills = skills.filter(s => s.category === filters.category)
    }

    // Level filter
    if (filters.level !== 'all') {
      skills = skills.filter(s => s.level === filters.level)
    }

    // Gaps only
    if (filters.showGapsOnly) {
      skills = skills.filter(s => s.isGap)
    }

    // Sort
    switch (filters.sort) {
      case 'strongest':
        skills.sort((a, b) => b.overallScore - a.overallScore)
        break
      case 'weakest':
        skills.sort((a, b) => a.overallScore - b.overallScore)
        break
      case 'recent':
        skills.sort((a, b) => b.evidenceCount - a.evidenceCount)
        break
    }

    return skills
  }, [data, filters])

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6">
        <AlertTriangle className="size-12 text-red-500" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={fetchData} variant="outline" className="gap-2">
          <RefreshCw className="size-4" /> Try Again
        </Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6 p-4 md:p-6 pb-8">
      {/* Section A: Hero Card */}
      <HeroCard data={data} />

      {/* Section B: Skill Radar */}
      <SkillRadarSection data={data} />

      {/* Main tabbed content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="skills" className="gap-1.5 text-xs">
            <Target className="size-3.5" /> Skills
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5 text-xs">
            <Activity className="size-3.5" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="career" className="gap-1.5 text-xs">
            <Briefcase className="size-3.5" /> Career
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-1.5 text-xs">
            <Users className="size-3.5" /> Compare
          </TabsTrigger>
          <TabsTrigger value="challenges" className="gap-1.5 text-xs">
            <Flame className="size-3.5" /> Challenges
          </TabsTrigger>
          <TabsTrigger value="share" className="gap-1.5 text-xs">
            <Share2 className="size-3.5" /> Share
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs">
            <Settings className="size-3.5" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4 mt-4">
          {/* Section C: Filters */}
          <FilterBar skills={data.skills} filters={filters} onFilterChange={setFilters} />

          {/* Section D: Skill Cards */}
          <div className="space-y-3">
            {filteredSkills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No skills match your filters</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting the category, level, or gap filter</p>
              </div>
            ) : (
              filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isExpanded={expandedSkill === skill.id}
                  onToggle={() => setExpandedSkill(expandedSkill === skill.id ? null : skill.id)}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-4">
          <SkillTimeline data={data} />
        </TabsContent>

        {/* Career Tab */}
        <TabsContent value="career" className="mt-4">
          <CareerPathSection data={data} />
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="mt-4">
          <SkillComparison data={data} />
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="mt-4">
          <SkillChallenges data={data} />
        </TabsContent>

        {/* Share Tab */}
        <TabsContent value="share" className="mt-4">
          <ShareableProfile data={data} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <SkillSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
