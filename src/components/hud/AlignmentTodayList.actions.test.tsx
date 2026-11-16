import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { mergeCompletions } from '@/lib/alignment-tasks'
import { readOneThing, takeOracleDraft } from '@/lib/alignment-actions'
import { AlignmentTodayList } from './AlignmentTodayList'

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params: _params, hash: _hash, ...rest }: any) => <a href={to} {...rest}>{children}</a>,
  useNavigate: () => navigate,
}))
vi.mock('./OracleContext', () => ({ useSafeOracle: () => undefined }))

const alignment = {
  memberId: 'member-1',
  currentDate: '2026-11-15',
  setTaskCompleted: vi.fn(),
  openPractice: vi.fn(),
}
vi.mock('@/hooks/useDailyAlignment', () => ({ useDailyAlignment: () => alignment }))

function renderList(completed: string[] = []) {
  const onToggle = vi.fn()
  const onClose = vi.fn()
  const tasks = mergeCompletions(completed)
  render(
    <AlignmentTodayList tasks={tasks} countReady todayLabel="Sun, Nov 15" onToggle={onToggle} onClose={onClose} />,
  )
  return { onToggle, onClose }
}

const row = (title: string) =>
  screen.getAllByTestId('alignment-task-row').find((el) => el.textContent?.includes(title))!

describe('AlignmentTodayList task shortcuts', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('ticks from the checkbox without opening the row', () => {
    const { onToggle } = renderList()
    fireEvent.click(screen.getByRole('button', { name: 'Mark Help a member done' }))
    expect(onToggle).toHaveBeenCalledWith('community-outreach')
    expect(screen.queryByTestId('alignment-task-panel')).not.toBeInTheDocument()
  })

  it('opens Help a member with a forum link and still lets the member mark it done', () => {
    const { onToggle, onClose } = renderList()
    fireEvent.click(row('Help a member'))
    expect(screen.getByText(/upvote another member's post/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open the forum' }))
    expect(onClose).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith({ to: '/forum' })
    fireEvent.click(screen.getByRole('button', { name: 'Mark done' }))
    expect(onToggle).toHaveBeenCalledWith('community-outreach')
  })

  it('starts the deep work timer from Do deep work', () => {
    renderList()
    fireEvent.click(row('Do deep work'))
    fireEvent.click(screen.getByRole('button', { name: 'Start a focus timer' }))
    expect(alignment.openPractice).toHaveBeenCalledWith('deep-work')
  })

  it('saves the one thing, ticks the task and shows it on Close the day', () => {
    renderList()
    fireEvent.click(row('Pick your one thing'))
    fireEvent.change(screen.getByLabelText('Your one thing today'), { target: { value: 'Ship the forum fix' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(alignment.setTaskCompleted).toHaveBeenCalledWith('prompt-construction', true)
    expect(readOneThing('member-1', '2026-11-15')).toBe('Ship the forum fix')
    const lines = screen.getAllByTestId('alignment-one-thing-line').map((el) => el.textContent)
    expect(lines).toEqual(['Ship the forum fix', 'Did you do it? Ship the forum fix'])
  })

  it('hands the Oracle a starter line for Let one thing go', () => {
    renderList()
    fireEvent.click(row('Let one thing go'))
    fireEvent.click(screen.getByRole('button', { name: 'Talk it through' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/oracle' })
    expect(takeOracleDraft()).toEqual({
      text: expect.stringContaining('Help me let go'),
      taskKey: 'reflection-log',
    })
  })

  it('ticks tasks without a shortcut straight from the row', () => {
    const { onToggle } = renderList()
    fireEvent.click(row('Reset your focus'))
    expect(onToggle).toHaveBeenCalledWith('nutritional-efficiency-break')
  })
})
