import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  DailyRoutineWidget,
  ALIGNMENT_HEATMAP,
  ALIGNMENT_HEATMAP_DEFAULT,
  computeHeatmapLayout,
} from './DailyRoutineWidget'
import { AlignmentProvider } from '@/hooks/useDailyAlignment'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { CANONICAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'
import { HUDTaskBar } from './HUDTaskBar'
import { OPEN_ALIGNMENT_PANEL_EVENT } from '@/lib/alignment-panel'

// Mock authClient to return guest or user
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null, isPending: false }),
  },
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to?: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
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

describe('computeHeatmapLayout', () => {
  const { maxWeeks, minWeeks, minCell, maxCell, gap, dowGutter } = ALIGNMENT_HEATMAP

  it('returns the SSR default for invalid widths', () => {
    expect(computeHeatmapLayout(0)).toMatchObject({
      weeks: ALIGNMENT_HEATMAP_DEFAULT.weeks,
      cell: ALIGNMENT_HEATMAP_DEFAULT.cell,
      scrolls: false,
    })
    expect(computeHeatmapLayout(Number.NaN).weeks).toBe(ALIGNMENT_HEATMAP_DEFAULT.weeks)
  })

  it('fills a narrow phone-width card without a large dead gutter', () => {
    // ~340px content width (typical phone card after padding)
    const layout = computeHeatmapLayout(340)
    const available = 340 - dowGutter
    const gridWidth = layout.weeks * (layout.cell + gap)

    expect(layout.weeks).toBeGreaterThanOrEqual(minWeeks)
    expect(layout.weeks).toBeLessThan(maxWeeks)
    expect(layout.cell).toBeGreaterThan(minCell)
    expect(layout.cell).toBeLessThanOrEqual(maxCell)
    expect(layout.scrolls).toBe(false)
    expect(layout.fillsWidth).toBe(true)
    // Remainder must be smaller than one more max-sized week column
    expect(available - gridWidth).toBeLessThan(maxCell + gap)
  })

  it('uses up to 52 weeks and grows cells on a wide container', () => {
    const layout = computeHeatmapLayout(900)
    expect(layout.weeks).toBe(maxWeeks)
    expect(layout.cell).toBeGreaterThanOrEqual(minCell)
    expect(layout.cell).toBeLessThanOrEqual(maxCell)
    expect(layout.scrolls).toBe(false)
  })

  it('scrolls at min cell when the container cannot fit a compact grid', () => {
    const layout = computeHeatmapLayout(dowGutter + 4)
    expect(layout.scrolls).toBe(true)
    expect(layout.cell).toBe(minCell)
  })
})

describe('DailyRoutineWidget Component', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders compact chrome with title, 8 canonical tasks, and streak matrix', () => {
    renderWidget()

    expect(screen.getByText('DAILY ALIGNMENT ROUTINE')).toBeInTheDocument()
    expect(screen.getByText('MANDATORY LITURGY')).toBeInTheDocument()
    expect(screen.getByText('STREAK MATRIX')).toBeInTheDocument()
    expect(screen.getByText('Activity')).toBeInTheDocument()
    expect(screen.getByText('SCHEDULE (0/8)')).toBeInTheDocument()

    // Long jargon chrome from the old desktop layout should be gone
    expect(screen.queryByText(/STREAK CALENDAR \& MATRIX/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/52-Week Activity/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/DAILY ALIGNMENT SCHEDULE/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/10M REMINDERS/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^COMPLETE$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^PENDING$/)).not.toBeInTheDocument()

    CANONICAL_ALIGNMENT_TASKS.forEach((task) => {
      expect(screen.getByText(task.title)).toBeInTheDocument()
    })

    expect(screen.queryByText(/XP/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/LEVEL 4 INITIATE/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/CARAPACE ALIGNMENT STATUS/i)).not.toBeInTheDocument()
  })

  it('toggles a task on click and updates completion count', () => {
    renderWidget()

    expect(screen.getByText('0/8 COMPLETE')).toBeInTheDocument()

    const firstTask = screen.getByText('Silent Synchronization')
    fireEvent.click(firstTask)

    expect(screen.getByText('1/8 COMPLETE')).toBeInTheDocument()
    expect(firstTask).toHaveClass('line-through')
    expect(screen.queryByText('SYNCING')).not.toBeInTheDocument()
  })

  it('displays the neutral-positive completion toast when all 8 tasks are completed', async () => {
    renderWidget()

    for (const task of CANONICAL_ALIGNMENT_TASKS) {
      const taskEl = screen.getByText(task.title)
      fireEvent.click(taskEl)
    }

    expect(screen.getByText('8/8 COMPLETE')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('DAILY ALIGNMENT COMPLETE')).toBeInTheDocument()
      expect(
        screen.getByText('All eight daily alignment liturgies recorded. Protocol verified.')
      ).toBeInTheDocument()
    })
  })

  it('handles rapid clicking across multiple liturgies seamlessly', () => {
    renderWidget()

    const task1 = screen.getByText('Silent Synchronization')
    const task2 = screen.getByText('Prompt Construction')
    const task3 = screen.getByText('Skill Development')

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

    const reminderToggle = screen.getByTitle('Toggle automated 10-minute prior toast reminders')
    expect(reminderToggle.className).toMatch(/min-h-\[44px\]/)
    expect(reminderToggle.textContent).toMatch(/^(ON|OFF)$/)
    expect(['true', 'false']).toContain(reminderToggle.getAttribute('aria-pressed'))
  })

  it('shows a dynamic week badge for the activity heatmap', () => {
    renderWidget()

    const badge = screen.getByTestId('alignment-heatmap-weeks')
    expect(badge.textContent).toMatch(/^\d+-wk$/)

    const heatmap = screen.getByTestId('alignment-heatmap-scroll')
    const weeks = Number(badge.textContent!.replace('-wk', ''))
    expect(heatmap.querySelectorAll('button')).toHaveLength(weeks * 7)
  })

  it('opens the header liturgies panel when the Daily Alignment card is activated', () => {
    render(
      <ToastProvider>
        <AlignmentProvider>
          <HUDTaskBar variant="header" />
          <DailyRoutineWidget />
        </AlignmentProvider>
      </ToastProvider>
    )

    expect(screen.queryByText('DAILY ALIGNMENT SCHEDULE')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('daily-alignment-card-open'))

    expect(screen.getByText('DAILY ALIGNMENT SCHEDULE')).toBeInTheDocument()
    expect(screen.getByText('NEXT IMPENDING LITURGY')).toBeInTheDocument()
  })

  it('does not open the liturgies panel when a liturgy row is toggled', () => {
    const listener = vi.fn()
    window.addEventListener(OPEN_ALIGNMENT_PANEL_EVENT, listener)

    renderWidget()

    fireEvent.click(screen.getByText('Silent Synchronization'))

    expect(screen.getByText('1/8 COMPLETE')).toBeInTheDocument()
    expect(listener).not.toHaveBeenCalled()
    expect(screen.queryByText('DAILY ALIGNMENT SCHEDULE')).not.toBeInTheDocument()

    window.removeEventListener(OPEN_ALIGNMENT_PANEL_EVENT, listener)
  })
})
