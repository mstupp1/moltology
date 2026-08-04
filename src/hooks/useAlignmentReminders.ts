import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { calculateReminderTime, isReminderDue } from '@/lib/alignment-reminders'

export interface AlignmentTaskItem {
  id: string
  time: string
  title: string
  xp: number
  completed: boolean
}

export interface UseAlignmentRemindersOptions {
  checkIntervalMs?: number
  offsetMinutes?: number
  enabledInitially?: boolean
}

export function useAlignmentReminders(
  tasks: AlignmentTaskItem[] = [],
  options: UseAlignmentRemindersOptions = {}
) {
  const { checkIntervalMs = 5000, offsetMinutes = 10, enabledInitially = true } = options

  // Safely attempt to access ToastProvider context, fallback to no-op if omitted
  let toast: {
    info: (m: string, o?: any) => string
    success: (m: string, o?: any) => string
    warning: (m: string, o?: any) => string
    error: (m: string, o?: any) => string
    hud: (m: string, o?: any) => string
  }

  try {
    const toastCtx = useToast()
    toast = toastCtx.toast
  } catch {
    toast = {
      info: () => '',
      success: () => '',
      warning: () => '',
      error: () => '',
      hud: () => '',
    }
  }

  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('moltology_alignment_reminders_enabled')
      if (stored !== null) return stored === 'true'
    }
    return enabledInitially
  })

  // Ref to track triggered task keys to avoid duplicate toasts on the same date
  const triggeredKeysRef = useRef<Set<string>>(new Set())

  // Persist reminder toggle preference
  const toggleReminders = useCallback(() => {
    setRemindersEnabled((prev) => {
      const next = !prev
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('moltology_alignment_reminders_enabled', String(next))
      }
      return next
    })
  }, [])

  // Check uncompleted tasks against current time
  const checkReminders = useCallback(() => {
    if (!remindersEnabled || !tasks || tasks.length === 0) return

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10) // YYYY-MM-DD

    tasks.forEach((task) => {
      if (task.completed) return

      const reminderInfo = calculateReminderTime(task.time, offsetMinutes)
      if (!reminderInfo) return

      if (isReminderDue(task.time, now, offsetMinutes)) {
        const key = `${task.id}-${dateStr}-${reminderInfo.reminderHours}:${reminderInfo.reminderMinutes}`

        if (!triggeredKeysRef.current.has(key)) {
          triggeredKeysRef.current.add(key)
          toast.hud(
            `Upcoming alignment protocol "${task.title}" starts in ${offsetMinutes}m (at ${reminderInfo.startTimeFormatted}). Prepare chassis!`,
            {
              title: `ALIGNMENT REMINDER (${reminderInfo.reminderTimeFormatted}) 🔔`,
              duration: 8000,
            }
          )
        }
      }
    })
  }, [remindersEnabled, tasks, offsetMinutes, toast])

  // Timer ticker loop for active checking
  useEffect(() => {
    checkReminders() // Immediate check on mount/change
    const interval = setInterval(checkReminders, checkIntervalMs)
    return () => clearInterval(interval)
  }, [checkReminders, checkIntervalMs])

  // Dispatch an instant test reminder toast
  const triggerTestReminder = useCallback(
    (customTask?: AlignmentTaskItem) => {
      const targetTask = customTask || tasks.find((t) => !t.completed) || tasks[0] || {
        id: 'test',
        time: '12:00',
        title: 'Neural Synchronization',
        xp: 100,
        completed: false,
      }

      const reminderInfo = calculateReminderTime(targetTask.time, offsetMinutes)
      const reminderTimeDisplay = reminderInfo ? reminderInfo.reminderTimeFormatted : '11:50'
      const startTimeDisplay = reminderInfo ? reminderInfo.startTimeFormatted : targetTask.time

      toast.hud(
        `[TEST ALERT] "${targetTask.title}" scheduled for ${startTimeDisplay}. Reminder window active 10m prior at ${reminderTimeDisplay}.`,
        {
          title: `ALIGNMENT REMINDER (${reminderTimeDisplay}) 🔔`,
          duration: 6000,
        }
      )
    },
    [tasks, offsetMinutes, toast]
  )

  // Helper to format reminder time string for UI badges
  const getTaskReminderTime = useCallback(
    (timeStr: string) => {
      const res = calculateReminderTime(timeStr, offsetMinutes)
      return res ? res.reminderTimeFormatted : null
    },
    [offsetMinutes]
  )

  return {
    remindersEnabled,
    toggleReminders,
    triggerTestReminder,
    getTaskReminderTime,
  }
}
