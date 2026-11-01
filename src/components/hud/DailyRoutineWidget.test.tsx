import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  DailyRoutineWidget,
  ALIGNMENT_HEATMAP,
  ALIGNMENT_HEATMAP_DEFAULT,
  buildHeatmapGrid,
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

function completeSilentSync() {
  fireEvent.click(screen.getByRole('button', { name: /Silent Synchronization/i }))
  expect(screen.getByRole('dialog', { name: /Silent synchronization/i })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))
  fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
}

describe('computeHeatmapLayout', () => {
  const { maxWeeks, minCell, maxCell, gap, dowGutter } = ALIGNMENT_HEATMAP

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

    expect(layout.weeks).toBe(maxWeeks)
    expect(layout.cell).toBeGreaterThan(minCell)
    expect(layout.cell).toBeLessThanOrEqual(maxCell)
    expect(layout.scrolls).toBe(false)
    expect(layout.fillsWidth).toBe(true)
    expect(gridWidth).toBeLessThanOrEqual(available)
  })

  it('caps the grid at the 90-day calendar width and grows cells on a wide container', () => {
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

  it('marks exactly the trailing 90 dates as in range and blanks calendar padding', () => {
    const today = '2026-10-15'
    const result = buildHeatmapGrid([], today)
    const cells = result.grid.flat()
    const inRange = cells.filter((cell) => !cell.isOutsideRange)
    const expectedStart = new Date(`${today}T12:00:00`)
    expectedStart.setDate(expectedStart.getDate() - 89)

    expect(inRange).toHaveLength(90)
    expect(inRange[0].date).toBe(
      `${expectedStart.getFullYear()}-${String(expectedStart.getMonth() + 1).padStart(2, '0')}-${String(expectedStart.getDate()).padStart(2, '0')}`
    )
    expect(inRange.at(-1)?.date).toBe(today)
    expect(result.grid.length).toBeLessThanOrEqual(maxWeeks)
    expect(cells.filter((cell) => cell.isOutsideRange).every((cell) => cell.count === 0)).toBe(true)
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

  it('renders compact chrome with title, 8 canonical tasks, and the week bars', () => {
    renderWidget()

    expect(screen.getByText('Daily alignment')).toBeInTheDocument()
    expect(screen.queryByText('MANDATORY LITURGY')).not.toBeInTheDocument()
    expect(screen.getByText('Last 7 days')).toBeInTheDocument()
    expect(screen.getByText('Activity')).toBeInTheDocument()
    expect(screen.getByText('Today’s schedule')).toBeInTheDocument()
    expect(screen.queryByText(/COMPLETE$/)).not.toBeInTheDocument()

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

  it('opens the silent synchronization dialog and records completion after the session', () => {
    renderWidget()

    expect(screen.getByText('0/8 done')).toBeInTheDocument()

    completeSilentSync()

    expect(screen.getByText('1/8 done')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Silent Synchronization/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('displays the neutral-positive completion toast when all 8 tasks are completed', async () => {
    renderWidget()

    for (const task of CANONICAL_ALIGNMENT_TASKS) {
      if (task.key === 'silent-synchronization') continue
      const taskEl = screen.getByText(task.title)
      fireEvent.click(taskEl)
    }
    completeSilentSync()

    expect(screen.getByText('8/8 done')).toBeInTheDocument()

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

    completeSilentSync()
    fireEvent.click(task2)
    fireEvent.click(task3)

    expect(screen.getByText('3/8 done')).toBeInTheDocument()
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

    expect(screen.queryByRole('switch', { name: /reminders/i })).not.toBeInTheDocument()
  })

  it('shows the 90-day range and disables blank calendar padding', () => {
    renderWidget()

    const badge = screen.getByTestId('alignment-heatmap-weeks')
    expect(badge.textContent).toBe('90 days')

    const heatmap = screen.getByTestId('alignment-heatmap-scroll')
    const allCells = heatmap.querySelectorAll('button')
    const activeCells = heatmap.querySelectorAll('button:not(:disabled)')
    const blankCells = heatmap.querySelectorAll('button:disabled')
    expect(allCells.length % 7).toBe(0)
    expect(allCells.length / 7).toBeLessThanOrEqual(ALIGNMENT_HEATMAP.maxWeeks)
    expect(activeCells).toHaveLength(90)
    expect(blankCells.length).toBe(allCells.length - 90)
    expect(Array.from(blankCells).every((cell) => cell.className.includes('border-transparent'))).toBe(true)
    expect(Array.from(blankCells).every((cell) => cell.getAttribute('aria-label')?.includes('outside 90-day history'))).toBe(true)
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

    expect(screen.queryByTestId('alignment-panel')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('daily-alignment-card-open'))

    expect(screen.getByTestId('alignment-panel')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tasks/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('launches silent synchronization without opening the liturgies panel', () => {
    const listener = vi.fn()
    window.addEventListener(OPEN_ALIGNMENT_PANEL_EVENT, listener)

    renderWidget()

    fireEvent.click(screen.getByText('Silent Synchronization'))

    expect(screen.getByRole('dialog', { name: /Silent synchronization/i })).toBeInTheDocument()
    expect(screen.getByText('0/8 done')).toBeInTheDocument()
    expect(listener).not.toHaveBeenCalled()
    expect(screen.queryByTestId('alignment-panel')).not.toBeInTheDocument()

    window.removeEventListener(OPEN_ALIGNMENT_PANEL_EVENT, listener)
  })

  it('does not uncomplete silent synchronization when the dialog is reopened', () => {
    renderWidget()
    completeSilentSync()
    expect(screen.getByText('1/8 done')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Silent Synchronization/i }))
    expect(screen.getByText('1/8 done')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(screen.getByText('1/8 done')).toBeInTheDocument()
  })
})

describe('DailyRoutineWidget next liturgy', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('marks only the first open liturgy as next and moves the mark when it is done', () => {
    renderWidget()
    expect(screen.getAllByText('Next')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /Silent Synchronization/i }).textContent).toMatch(/Next$/)

    completeSilentSync()
    expect(screen.getAllByText('Next')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /Prompt Construction/i }).textContent).toMatch(/Next$/)
  })
})
