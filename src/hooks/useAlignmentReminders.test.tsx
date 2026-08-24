import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { useAlignmentReminders, AlignmentTaskItem, resetTriggeredReminders } from './useAlignmentReminders'
import { parseStartTime, calculateReminderTime, isReminderDue } from '@/lib/alignment-reminders'

describe('alignment-reminders lib', () => {
  it('parses start time correctly', () => {
    expect(parseStartTime('05:30')).toEqual({ hours: 5, minutes: 30 })
    expect(parseStartTime('06:00–08:00')).toEqual({ hours: 6, minutes: 0 })
    expect(parseStartTime('13:15 - 17:00')).toEqual({ hours: 13, minutes: 15 })
    expect(parseStartTime('invalid')).toBeNull()
  })

  it('calculates 10-minute prior reminder time correctly', () => {
    const res1 = calculateReminderTime('05:30', 10)
    expect(res1?.reminderHours).toBe(5)
    expect(res1?.reminderMinutes).toBe(20)
    expect(res1?.reminderTimeFormatted).toBe('05:20')

    const res2 = calculateReminderTime('06:00', 10)
    expect(res2?.reminderHours).toBe(5)
    expect(res2?.reminderMinutes).toBe(50)
    expect(res2?.reminderTimeFormatted).toBe('05:50')

    // Boundary test: midnight underflow
    const res3 = calculateReminderTime('00:05', 10)
    expect(res3?.reminderHours).toBe(23)
    expect(res3?.reminderMinutes).toBe(55)
    expect(res3?.reminderTimeFormatted).toBe('23:55')
  })

  it('correctly identifies when a reminder is due at a given date', () => {
    const dueTime = new Date(2026, 7, 4, 5, 20, 0)
    expect(isReminderDue('05:30', dueTime, 10)).toBe(true)

    const notDueTime = new Date(2026, 7, 4, 5, 21, 0)
    expect(isReminderDue('05:30', notDueTime, 10)).toBe(false)
  })
})

const TestConsumer: React.FC<{ tasks: AlignmentTaskItem[]; testIdPrefix?: string }> = ({
  tasks,
  testIdPrefix = '',
}) => {
  const { remindersEnabled, toggleReminders, triggerTestReminder, getTaskReminderTime } =
    useAlignmentReminders(tasks)

  return (
    <div>
      <div data-testid={`${testIdPrefix}enabled-state`}>
        {remindersEnabled ? 'ENABLED' : 'DISABLED'}
      </div>
      <div data-testid={`${testIdPrefix}task-reminder-time`}>{getTaskReminderTime('05:30')}</div>
      <button onClick={toggleReminders}>TOGGLE</button>
      <button onClick={() => triggerTestReminder()}>TEST</button>
    </div>
  )
}

describe('useAlignmentReminders hook', () => {
  const sampleTasks: AlignmentTaskItem[] = [
    { id: '1', time: '05:30', title: 'Silent Synchronization', xp: 50, completed: false },
    { id: '2', time: '09:00', title: 'Skill Development', xp: 90, completed: false },
  ]

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    resetTriggeredReminders()
  })

  it('renders with reminders enabled by default and returns 10m prior time', () => {
    render(
      <ToastProvider>
        <TestConsumer tasks={sampleTasks} />
      </ToastProvider>
    )

    expect(screen.getByTestId('enabled-state')).toHaveTextContent('ENABLED')
    expect(screen.getByTestId('task-reminder-time')).toHaveTextContent('05:20')
  })

  it('toggles reminder state on button click', () => {
    render(
      <ToastProvider>
        <TestConsumer tasks={sampleTasks} />
      </ToastProvider>
    )

    const toggleBtn = screen.getByText('TOGGLE')
    fireEvent.click(toggleBtn)
    expect(screen.getByTestId('enabled-state')).toHaveTextContent('DISABLED')

    fireEvent.click(toggleBtn)
    expect(screen.getByTestId('enabled-state')).toHaveTextContent('ENABLED')
  })

  it('dispatches a test toast notification when triggerTestReminder is called', () => {
    render(
      <ToastProvider>
        <TestConsumer tasks={sampleTasks} />
      </ToastProvider>
    )

    const testBtn = screen.getByText('TEST')
    fireEvent.click(testBtn)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/\[TEST ALERT\]/i)).toBeInTheDocument()
    expect(screen.getByText(/Silent Synchronization/i)).toBeInTheDocument()
  })

  it('ensures 3 concurrent consumer hook instances on the same page only trigger 1 notification when due', () => {
    vi.useFakeTimers()
    const mockDate = new Date(2026, 7, 4, 5, 20, 0) // 05:20 is 10 min before 05:30
    vi.setSystemTime(mockDate)

    render(
      <ToastProvider>
        {/* Simulating 1: HUDHeader DigitalClock, 2: HUDSidebar DigitalClock, 3: LaunchpadCarousel */}
        <TestConsumer tasks={sampleTasks} testIdPrefix="header-" />
        <TestConsumer tasks={sampleTasks} testIdPrefix="sidebar-" />
        <TestConsumer tasks={sampleTasks} testIdPrefix="carousel-" />
      </ToastProvider>
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(1)
    expect(screen.getByText(/Upcoming alignment protocol "Silent Synchronization"/i)).toBeInTheDocument()

    vi.useRealTimers()
  })
})
