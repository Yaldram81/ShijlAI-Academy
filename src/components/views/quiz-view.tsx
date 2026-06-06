'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Trophy,
  Zap,
  Target,
  RotateCcw,
  Award,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Question, QuestionType, Quiz } from '@/lib/types'

interface QuizQuestion extends Omit<Question, 'options'> {
  options: string[] // parsed from JSON
}

interface QuizData {
  quiz: Quiz & {
    questions: QuizQuestion[]
    course: {
      id: string
      title: string
    }
  }
}

interface GradedAnswer {
  questionId: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string | null
  points: number
}

interface QuizResult {
  attempt: {
    id: string
    score: number
    maxScore: number
    percentage: number
    passed: boolean
    xpEarned: number
  }
  gradedAnswers: GradedAnswer[]
}

export function QuizView() {
  const { selectedQuiz, setSelectedQuiz, setCurrentView, currentUser, selectedCourse } = useAppStore()

  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  const fetchQuiz = useCallback(async () => {
    if (!selectedQuiz) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/quizzes/${selectedQuiz.id}`)
      if (!res.ok) throw new Error('Failed to fetch quiz')
      const data = await res.json()
      setQuizData(data)
      if (data.quiz?.timeLimit) {
        setTimeRemaining(data.quiz.timeLimit * 60)
      }
    } catch {
      setError('Failed to load quiz.')
    } finally {
      setLoading(false)
    }
  }, [selectedQuiz])

  useEffect(() => {
    fetchQuiz()
  }, [fetchQuiz])

  // Timer effect
  useEffect(() => {
    if (!timerActive || submitted || timeRemaining <= 0) return
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setTimerActive(false)
          // Auto-submit when time runs out
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive, submitted])

  // Start timer when quiz data loads
  useEffect(() => {
    if (quizData && !submitted) {
      setTimerActive(true)
    }
  }, [quizData])

  const handleSubmit = async () => {
    if (!quizData || !currentUser || submitted) return
    setSubmitting(true)
    setTimerActive(false)

    try {
      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }))

      const res = await fetch(`/api/quizzes/${quizData.quiz.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          answers: answerArray,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit quiz')
      const data = await res.json()
      setResult(data)
      setSubmitted(true)
      setShowConfirmDialog(false)
    } catch {
      setError('Failed to submit quiz. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const questions = quizData?.quiz?.questions || []
  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  // Error state
  if (error || !quizData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-card ios-shadow-sm p-12 text-center"
      >
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <HelpCircle className="size-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="text-[22px] font-bold">Quiz not found</h3>
          <p className="text-[13px] text-muted-foreground">{error || 'Unable to load quiz.'}</p>
        </div>
        <Button variant="outline" className="rounded-2xl ios-press" onClick={() => {
          setSelectedQuiz(null)
          setCurrentView(selectedCourse ? 'course-detail' : 'courses')
        }}>
          Go Back
        </Button>
      </motion.div>
    )
  }

  // Results screen
  if (submitted && result && showResults) {
    const { attempt, gradedAnswers } = result
    const correctCount = gradedAnswers.filter((a) => a.isCorrect).length

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Results hero card */}
        <div className={cn(
          'rounded-3xl ios-shadow-lg overflow-hidden',
          attempt.passed
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
            : 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
        )}>
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.2 }}
            >
              {attempt.passed ? (
                <Trophy className="mx-auto size-16 text-yellow-300" />
              ) : (
                <RotateCcw className="mx-auto size-16 text-red-200" />
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="mt-4 text-[28px] font-bold">
                {attempt.passed ? 'Congratulations!' : 'Keep Trying!'}
              </h2>
              <p className="mt-1 text-[15px] opacity-80">
                {attempt.passed
                  ? 'You passed the quiz! Great work!'
                  : "You didn't pass this time, but you can always try again."}
              </p>
            </motion.div>

            {/* Score display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 grid grid-cols-3 gap-3"
            >
              <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                <p className="text-[28px] font-bold">{attempt.percentage}%</p>
                <p className="text-[11px] opacity-80">Score</p>
              </div>
              <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                <p className="text-[28px] font-bold">{correctCount}/{totalQuestions}</p>
                <p className="text-[11px] opacity-80">Correct</p>
              </div>
              <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                <p className="text-[28px] font-bold flex items-center justify-center gap-1">
                  <Zap className="size-5" />
                  {attempt.xpEarned}
                </p>
                <p className="text-[11px] opacity-80">XP Earned</p>
              </div>
            </motion.div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <Badge className={cn(
                'text-[13px] font-semibold border-0 rounded-xl',
                attempt.passed
                  ? 'bg-emerald-800/50 text-emerald-100'
                  : 'bg-red-800/50 text-red-100'
              )}>
                {attempt.passed ? (
                  <CheckCircle2 className="mr-1 size-4" />
                ) : (
                  <XCircle className="mr-1 size-4" />
                )}
                {attempt.passed ? 'PASSED' : 'NOT PASSED'}
              </Badge>
              <Badge className="bg-amber-800/50 text-amber-100 border-0 text-[13px] rounded-xl">
                <Target className="mr-1 size-4" />
                Passing: {quizData.quiz.passingScore}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Question-by-question review */}
        <div className="rounded-2xl bg-card ios-shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="size-5 text-primary" />
            <h3 className="text-[17px] font-semibold">Question Review</h3>
          </div>
          <div className="space-y-3">
            {gradedAnswers.map((ga, index) => {
              const question = questions.find((q) => q.id === ga.questionId)
              if (!question) return null

              return (
                <motion.div
                  key={ga.questionId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'rounded-2xl p-4',
                    ga.isCorrect
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/20'
                      : 'bg-red-50/80 dark:bg-red-950/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {ga.isCorrect ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
                    )}
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-[15px] font-medium text-foreground">
                        Q{index + 1}. {question.text}
                      </p>
                      <div className="space-y-1 text-[13px]">
                        <p>
                          <span className="text-muted-foreground">Your answer: </span>
                          <span className={cn(ga.isCorrect ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium')}>
                            {ga.userAnswer || '(no answer)'}
                          </span>
                        </p>
                        {!ga.isCorrect && (
                          <p>
                            <span className="text-muted-foreground">Correct answer: </span>
                            <span className="font-medium text-emerald-600">{ga.correctAnswer}</span>
                          </p>
                        )}
                        {ga.explanation && (
                          <div className="mt-2 rounded-xl bg-muted/50 p-3">
                            <p className="text-muted-foreground text-[13px]">
                              <span className="font-medium">Explanation: </span>
                              {ga.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[11px] shrink-0 rounded-xl">
                      {ga.points} pts
                    </Badge>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            className="rounded-2xl ios-press h-12 text-[15px]"
            onClick={() => {
              setSelectedQuiz(null)
              setCurrentView(selectedCourse ? 'course-detail' : 'courses')
            }}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to Course
          </Button>
          <Button
            onClick={() => {
              setSubmitted(false)
              setResult(null)
              setShowResults(false)
              setAnswers({})
              setCurrentQuestionIndex(0)
              if (quizData.quiz?.timeLimit) {
                setTimeRemaining(quizData.quiz.timeLimit * 60)
              }
              setTimerActive(true)
            }}
            className="rounded-2xl bg-primary text-primary-foreground h-12 text-[15px] font-semibold ios-press"
          >
            <RotateCcw className="mr-2 size-4" />
            Retake Quiz
          </Button>
        </div>
      </motion.div>
    )
  }

  // Submitted but showing score summary before full results
  if (submitted && result && !showResults) {
    const { attempt } = result
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-6 py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'flex size-36 items-center justify-center rounded-full ios-shadow-lg',
            attempt.passed ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-red-100 dark:bg-red-950/40'
          )}
        >
          <span className={cn(
            'text-[42px] font-bold',
            attempt.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          )}>
            {attempt.percentage}%
          </span>
        </motion.div>
        <div className="text-center space-y-2">
          <h2 className="text-[22px] font-bold">
            {attempt.passed ? 'You Passed!' : 'Not Passed'}
          </h2>
          <p className="text-[15px] text-muted-foreground">
            Score: {attempt.score}/{attempt.maxScore} points
          </p>
          <Badge className={cn(
            'text-[13px] border-0 rounded-xl',
            attempt.passed
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
          )}>
            <Zap className="mr-1 size-3.5" />
            +{attempt.xpEarned} XP
          </Badge>
        </div>
        <Button
          onClick={() => setShowResults(true)}
          className="rounded-2xl bg-primary text-primary-foreground h-12 text-[17px] font-semibold ios-press"
        >
          View Detailed Results
        </Button>
      </motion.div>
    )
  }

  // Quiz taking interface
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="space-y-6"
    >
      {/* Quiz Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 shrink-0 rounded-xl ios-press"
          onClick={() => {
            setSelectedQuiz(null)
            setCurrentView(selectedCourse ? 'course-detail' : 'courses')
          }}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-bold text-foreground">{quizData.quiz.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <HelpCircle className="size-3.5" />
              {totalQuestions} questions
            </span>
            <span className={cn(
              "flex items-center gap-1",
              timeRemaining <= 60 ? "text-amber-600 font-medium" : ""
            )}>
              <Clock className="size-3.5" />
              {formatTime(timeRemaining)}
            </span>
            <Badge variant="outline" className="text-[11px] capitalize rounded-xl">
              {quizData.quiz.type}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          <span>{answeredCount} answered</span>
        </div>
        <Progress value={((currentQuestionIndex + 1) / totalQuestions) * 100} className="h-2" />
      </div>

      {/* Timer warning */}
      {timeRemaining <= 60 && timeRemaining > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-2xl bg-amber-100 px-4 py-3 dark:bg-amber-950/40"
        >
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
          <span className="text-[15px] font-medium text-amber-700 dark:text-amber-300">
            Less than 1 minute remaining!
          </span>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Question area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <div className="rounded-2xl ios-shadow-sm bg-card p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-[11px] rounded-xl">
                      Q{currentQuestionIndex + 1}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] capitalize rounded-xl">
                      {currentQuestion.type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] rounded-xl">
                      {currentQuestion.points} pts
                    </Badge>
                  </div>
                  <h2 className="text-[17px] font-semibold leading-relaxed">
                    {currentQuestion.text}
                  </h2>

                  <div className="h-px bg-border/60 my-5" />

                  {/* MCQ */}
                  {currentQuestion.type === 'mcq' && (
                    <RadioGroup
                      value={answers[currentQuestion.id] || ''}
                      onValueChange={(value) =>
                        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
                      }
                      className="space-y-3"
                    >
                      {currentQuestion.options.map((option, idx) => (
                        <div key={idx}>
                          <Label
                            htmlFor={`option-${idx}`}
                            className={cn(
                              'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ios-press',
                              answers[currentQuestion.id] === option
                                ? 'border-primary bg-primary/10'
                                : 'border-transparent bg-muted/40 hover:border-primary/30 hover:bg-muted/60'
                            )}
                          >
                            <RadioGroupItem
                              value={option}
                              id={`option-${idx}`}
                            />
                            <span className="text-[15px]">{option}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {/* True/False */}
                  {currentQuestion.type === 'true_false' && (
                    <div className="flex gap-4">
                      {['True', 'False'].map((option) => (
                        <button
                          key={option}
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }))
                          }
                          className={cn(
                            'flex-1 rounded-xl border-2 p-6 text-center text-[17px] font-medium transition-all ios-press',
                            answers[currentQuestion.id] === option
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-transparent bg-muted/40 hover:border-primary/30 hover:bg-muted/60'
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fill in the blank */}
                  {currentQuestion.type === 'fill_blank' && (
                    <div className="space-y-2">
                      <Label htmlFor="fill-answer" className="text-[13px] text-muted-foreground">
                        Type your answer:
                      </Label>
                      <Input
                        id="fill-answer"
                        placeholder="Enter your answer..."
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQuestion.id]: e.target.value,
                          }))
                        }
                        className="max-w-md rounded-xl h-12 text-[15px]"
                      />
                    </div>
                  )}

                  {/* Short answer */}
                  {currentQuestion.type === 'short_answer' && (
                    <div className="space-y-2">
                      <Label htmlFor="short-answer" className="text-[13px] text-muted-foreground">
                        Write your answer:
                      </Label>
                      <Input
                        id="short-answer"
                        placeholder="Enter your answer..."
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQuestion.id]: e.target.value,
                          }))
                        }
                        className="max-w-md rounded-xl h-12 text-[15px]"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* iOS-style bottom navigation bar */}
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              className="rounded-2xl ios-press h-11 text-[15px]"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="mr-1 size-4" />
              Previous
            </Button>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="rounded-2xl bg-primary text-primary-foreground h-12 text-[17px] font-semibold ios-press"
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))
                }
                className="rounded-2xl ios-press h-11 text-[15px]"
              >
                Next
                <ChevronRight className="ml-1 size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Question overview sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-2xl bg-card ios-shadow-sm p-4">
            <h3 className="text-[17px] font-semibold mb-1">Question Overview</h3>
            <p className="text-[11px] text-muted-foreground mb-3">
              {answeredCount}/{totalQuestions} answered
            </p>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined
                const isCurrent = idx === currentQuestionIndex

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-xl text-[13px] font-medium transition-all ios-press',
                      isCurrent
                        ? 'bg-primary text-primary-foreground ios-shadow-sm'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <div className="size-3 rounded bg-emerald-100 dark:bg-emerald-950/40" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <div className="size-3 rounded bg-primary" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <div className="size-3 rounded bg-muted" />
                <span>Unanswered</span>
              </div>
            </div>

            {/* Submit button in sidebar for desktop */}
            <Button
              onClick={() => setShowConfirmDialog(true)}
              className="mt-4 w-full rounded-2xl bg-primary text-primary-foreground h-11 text-[15px] font-semibold ios-press"
              size="sm"
            >
              Submit Quiz
            </Button>
          </div>
        </div>
      </div>

      {/* Submit confirmation dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[22px] font-bold">Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p className="text-[15px]">
                  Are you sure you want to submit? You won&apos;t be able to change your answers after submission.
                </p>
                {answeredCount < totalQuestions && (
                  <div className="flex items-center gap-2 rounded-2xl bg-amber-100 px-4 py-3 dark:bg-amber-950/40">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-[13px] text-amber-700 dark:text-amber-300">
                      You have {totalQuestions - answeredCount} unanswered question{totalQuestions - answeredCount !== 1 ? 's' : ''}!
                    </span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-2xl ios-press">Continue Quiz</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-2xl bg-primary text-primary-foreground ios-press"
            >
              {submitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Submit Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
