import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { HUDTaskBar } from './HUDTaskBar'
import { mergeCompletions, CANONICAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'
import type { AlignmentContextValue } from '@/hooks/useDailyAlignment'
import { calculateProgression } from '@/lib/progression'

const mockAlignment: AlignmentContextValue = {
  tasks: mergeCompletions([]),
  completedCount: 0,
  totalCount: 8,
  isAllCompleted: false,
  streakDays: 0,
  streakHistory: [],
  history: [],
  isLoading: true,
  isSyncing: false,
  toggleTask: vi.fn(),
  refetch: vi.fn(),
  currentDate: '2026-08-31',
  isGuest: false,
  xp: 0,
  stage: 1,
  progression: calculateProgression(0, 1),
}

vi.mock('@/hooks/useDailyAlignment', () => ({
  useDailyAlignment: () => mockAlignment,
}))

function resetAlignment(partial: Partial<AlignmentContextValue> = {}) {
  mockAlignment.tasks = partial.tasks ?? mergeCompletions([])
  mockAlignment.completedCount = partial.completedCount ?? 0
  mockAlignment.isLoading = partial.isLoading ?? true
  mockAlignment.isAllCompleted = partial.isAllCompleted ?? false
}

describe('HUDTaskBar alignment count first paint', () => {
  beforeEach(() => {
    resetAlignment()
  })

  it('does not paint 0/8 in the header while liturgy count is still resolving', () => {
    render(<HUDTaskBar variant="header" />)

    expect(screen.queryByText('0/8')).not.toBeInTheDocument()
    expect(screen.queryByText(/0\/8/)).not.toBeInTheDocument()
    expect(screen.queryByText(/resolving/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Daily alignment tasks schedule')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText(/NEXT:/i)).not.toBeInTheDocument()
  })

  it('shows last-known liturgy count as soon as the count is ready', () => {
    const completedKeys = CANONICAL_ALIGNMENT_TASKS.slice(0, 4).map((t) => t.key)
    resetAlignment({
      isLoading: false,
      completedCount: 4,
      tasks: mergeCompletions(completedKeys),
    })

    render(<HUDTaskBar variant="header" />)

    expect(screen.getByText('4/8')).toBeInTheDocument()
    expect(screen.getByLabelText('Daily alignment tasks schedule')).toHaveAttribute('aria-busy', 'false')
    expect(screen.getByText(/NEXT:/i)).toBeInTheDocument()
    expect(screen.getByText('Iterative Refinement')).toBeInTheDocument()
    expect(screen.queryByText('COMPLETE')).not.toBeInTheDocument()
    expect(screen.queryByText('0/8')).not.toBeInTheDocument()
  })

  it('does not label the header chip NEXT when alignment is 8/8 complete', () => {
    resetAlignment({
      isLoading: false,
      completedCount: 8,
      isAllCompleted: true,
      tasks: mergeCompletions(CANONICAL_ALIGNMENT_TASKS.map((t) => t.key)),
    })

    render(<HUDTaskBar variant="header" />)

    expect(screen.getByText('8/8')).toBeInTheDocument()
    expect(screen.getByText('COMPLETE')).toBeInTheDocument()
    expect(screen.queryByText(/NEXT:/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Alignment Review')).not.toBeInTheDocument()
  })
})
