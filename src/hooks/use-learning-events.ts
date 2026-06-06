'use client'

import { useCallback } from 'react'
import { useAppStore } from '@/lib/store'

export function useLearningEvents() {
  const { currentUser } = useAppStore()

  const logEvent = useCallback(async (params: {
    eventType: string
    eventValue?: number
    courseId?: string
    topicId?: string
    metadata?: Record<string, unknown>
  }) => {
    const userId = currentUser?.id || 'demo-user-1'
    try {
      await fetch('/api/ai/shijlai/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          eventType: params.eventType,
          eventValue: params.eventValue ?? 0,
          courseId: params.courseId,
          topicId: params.topicId,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        }),
      })
    } catch {
      // silently fail - event logging should not block UX
    }
  }, [currentUser])

  return { logEvent }
}
