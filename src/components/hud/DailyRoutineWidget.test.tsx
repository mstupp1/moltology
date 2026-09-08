import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DailyRoutineWidget, ALIGNMENT_HEATMAP_MOBILE } from './DailyRoutineWidget'
import { AlignmentProvider } from '@/hooks/useDailyAlignment'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { CANONICAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'

// Mock authClient to return guest or user
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null, isPending: false }),
  },
}))

function renderWidget() {
  return render(
    <ToastProvider>
      <AlignmentProvider>
        <DailyRoutineWidget />
      </AlignmentProvider>
    </ToastProvider>
  )
}

function stubViewport(maxWidthPx: number, viewportWidth: number) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes(`max-width: ${maxWidthPx}px`) && viewportWidth <= maxWidthPx,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

describe('DailyRoutineWidget Component', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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
    expect(screen.getByText(/STREAK CALENDAR \& MATRIX/i)).toBeInTheDocument()
    expect(screen.getByText(/52-Week Activity/i)).toBeInTheDocument()
    // CARAPACE ALIGNMENT STATUS card has been replaced by the activity heatmap

    // All 8 canonical tasks should be rendered
    CANONICAL_ALIGNMENT_TASKS.forEach((task) => {
      expect(screen.getByText(task.title)).toBeInTheDocument()
    })

    // Assert that no XP references are rendered on the widget
    expect(screen.queryByText(/XP/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/LEVEL 4 INITIATE/i)).not.toBeInTheDocument()
    // Old carapace card should no longer exist
    expect(screen.queryByText(/CARAPACE ALIGNMENT STATUS/i)).not.toBeInTheDocument()
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
    expect(screen.queryByText('SYNCING')).not.toBeInTheDocument()
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

  it('handles rapid clicking across multiple liturgies seamlessly', () => {
    render(
      <ToastProvider>
        <AlignmentProvider>
          <DailyRoutineWidget />
        </AlignmentProvider>
      </ToastProvider>
    )

    const task1 = screen.getByText('Silent Synchronization')
    const task2 = screen.getByText('Prompt Construction')
    const task3 = screen.getByText('Skill Development')

    // Rapid clicks
    fireEvent.click(task1)
    fireEvent.click(task2)
    fireEvent.click(task3)

    expect(screen.getByText('3/8 COMPLETE')).toBeInTheDocument()
    expect(task1).toHaveClass('line-through')
    expect(task2).toHaveClass('line-through')
    expect(task3).toHaveClass('line-through')
  })

  it('uses toggle buttons with 44px tap targets and contains heatmap overflow', () => {
    renderWidget()

    const firstTask = screen.getByRole('button', { name: /Silent Synchronization/i })
    expect(firstTask).toHaveAttribute('aria-pressed', 'false')
    expect(firstTask.className).toMatch(/min-h-\[44px\]/)
    expect(firstTask.className).toMatch(/touch-manipulation/)

    const hub = document.getElementById('daily-routine-hub')
    expect(hub?.className).toMatch(/min-w-0/)
    expect(hub?.className).toMatch(/overflow-hidden/)

    const heatmap = screen.getByTestId('alignment-heatmap-scroll')
    expect(heatmap.className).toMatch(/overflow-x-auto/)
    expect(heatmap.className).toMatch(/min-w-0/)
  })

  it('compacts schedule chrome and heatmap to 20 weeks on narrow viewports', async () => {
    stubViewport(639, 390)
    renderWidget()

    await waitFor(() => {
      expect(screen.getByText('SCHEDULE (0/8)')).toBeInTheDocument()
      expect(screen.getByText('Activity')).toBeInTheDocument()
    })

    expect(screen.queryByText('52-Week Activity')).not.toBeInTheDocument()
    expect(screen.getByText('STREAK MATRIX')).toBeInTheDocument()

    const heatmap = screen.getByTestId('alignment-heatmap-scroll')
    expect(heatmap.querySelectorAll('button')).toHaveLength(ALIGNMENT_HEATMAP_MOBILE.weeks * 7)

    const reminderToggle = screen.getByRole('button', { name: /ON|OFF/i })
    expect(reminderToggle.className).toMatch(/min-h-\[44px\]/)
  })
})
