import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { mergeCompletions } from '@/lib/alignment-tasks'
import { AlignmentTodayList } from './AlignmentTodayList'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params: _params, hash: _hash, ...rest }: any) => <a href={to} {...rest}>{children}</a>,
  useNavigate: () => vi.fn(),
}))
vi.mock('./OracleContext', () => ({ useSafeOracle: () => undefined }))

const alignment = {
  tasks: mergeCompletions([]),
  streakDays: 6,
  memberId: 'member-1' as string | null,
  currentDate: '2026-11-21',
  setTaskCompleted: vi.fn(),
  openPractice: vi.fn(),
  isOffDay: true,
  showRestDay: true,
  practiceAnyway: vi.fn(),
}
vi.mock('@/hooks/useDailyAlignment', () => ({ useDailyAlignment: () => alignment }))

function renderList() {
  const tasks = mergeCompletions([])
  render(<AlignmentTodayList tasks={tasks} countReady todayLabel="Sat, Nov 21" onToggle={vi.fn()} onClose={vi.fn()} />)
}

describe('AlignmentTodayList on an off day', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    alignment.showRestDay = true
    alignment.memberId = 'member-1'
  })

  it('shows a rest-day note instead of the tasks', () => {
    renderList()
    expect(screen.getByTestId('alignment-rest-day')).toHaveTextContent('6-day streak is safe')
    expect(screen.queryAllByTestId('alignment-task-row')).toHaveLength(0)
    expect(screen.getByRole('link', { name: 'Change practice days' })).toBeInTheDocument()
  })

  it('brings the tasks back with Practice anyway', () => {
    renderList()
    fireEvent.click(screen.getByTestId('alignment-practice-anyway'))
    expect(alignment.practiceAnyway).toHaveBeenCalled()
  })

  it('marks the tasks as a bonus once practising on an off day', () => {
    alignment.showRestDay = false
    renderList()
    expect(screen.getAllByTestId('alignment-task-row')).toHaveLength(8)
    expect(screen.getByTestId('alignment-off-day-note')).toHaveTextContent('bonus')
  })

  it('does not offer Settings to guests', () => {
    alignment.memberId = null
    renderList()
    expect(screen.queryByRole('link', { name: 'Change practice days' })).not.toBeInTheDocument()
  })
})
