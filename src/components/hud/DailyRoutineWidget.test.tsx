import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DailyRoutineWidget } from './DailyRoutineWidget'
import { AlignmentProvider } from '@/hooks/useDailyAlignment'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { CANONICAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'

// Mock authClient to return guest or user
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null, isPending: false }),
  },
}))

describe('DailyRoutineWidget Component', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('renders correctly with title, 8 canonical tasks, and streak calendar', () => {
    render(
      <ToastProvider>
        <AlignmentProvider>
          <DailyRoutineWidget />
        </AlignmentProvider>
      </ToastProvider>
    )

    expect(screen.getByText('DAILY ALIGNMENT ROUTINE')).toBeInTheDocument()
    expect(screen.getByText('MANDATORY LITURGY')).toBeInTheDocument()
    expect(screen.getByText(/STREAK CALENDAR & MATRIX/i)).toBeInTheDocument()
    expect(screen.getByText(/CARAPACE ALIGNMENT STATUS/i)).toBeInTheDocument()

    // All 8 canonical tasks should be rendered
    CANONICAL_ALIGNMENT_TASKS.forEach((task) => {
      expect(screen.getByText(task.title)).toBeInTheDocument()
    })

    // Assert that no XP references are rendered on the widget
    expect(screen.queryByText(/XP/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/LEVEL 4 INITIATE/i)).not.toBeInTheDocument()
  })

  it('toggles a task on click and updates completion count', () => {
    render(
      <ToastProvider>
        <AlignmentProvider>
          <DailyRoutineWidget />
        </AlignmentProvider>
      </ToastProvider>
    )

    expect(screen.getByText('0/8 COMPLETE')).toBeInTheDocument()

    const firstTask = screen.getByText('Silent Synchronization')
    fireEvent.click(firstTask)

    expect(screen.getByText('1/8 COMPLETE')).toBeInTheDocument()
    expect(firstTask).toHaveClass('line-through')
  })

  it('displays the neutral-positive completion toast when all 8 tasks are completed', async () => {
    render(
      <ToastProvider>
        <AlignmentProvider>
          <DailyRoutineWidget />
        </AlignmentProvider>
      </ToastProvider>
    )

    // Complete all 8 tasks in sequence
    for (const task of CANONICAL_ALIGNMENT_TASKS) {
      const taskEl = screen.getByText(task.title)
      fireEvent.click(taskEl)
    }

    expect(screen.getByText('8/8 COMPLETE')).toBeInTheDocument()

    // Toast alert should be rendered
    await waitFor(() => {
      expect(screen.getByText('DAILY ALIGNMENT COMPLETE')).toBeInTheDocument()
      expect(
        screen.getByText('All eight daily alignment liturgies recorded. Protocol verified.')
      ).toBeInTheDocument()
    })
  })
})
