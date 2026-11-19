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
  tasks: [] as ReturnType<typeof mergeCompletions>,
  streakDays: 4,
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
  alignment.tasks = tasks
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

  it('opens Help a member with a forum button and its Codex passage', () => {
    const { onClose } = renderList()
    fireEvent.click(row('Help a member'))
    expect(screen.getByText(/upvote another member's post/)).toBeInTheDocument()
    expect(screen.getByTestId('alignment-codex-link')).toHaveTextContent('Read in the Codex')
    expect(screen.queryByRole('button', { name: /Mark done/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open the forum' }))
    expect(onClose).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith({ to: '/forum' })
  })

  it('keeps done tasks done: no checkbox button and the row does not open', () => {
    const { onToggle } = renderList(['community-outreach'])
    expect(screen.getByRole('img', { name: 'Help a member done' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark Help a member done' })).not.toBeInTheDocument()
    fireEvent.click(row('Help a member'))
    expect(screen.queryByTestId('alignment-task-panel')).not.toBeInTheDocument()
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('starts the deep work timer', () => {
    renderList()
    fireEvent.click(row('Do deep work'))
    fireEvent.click(screen.getByRole('button', { name: 'Start a focus timer' }))
    expect(alignment.openPractice).toHaveBeenCalledWith('deep-work')
  })

  it('treats Reset your focus as a plain break, not a timer', () => {
    renderList()
    fireEvent.click(row('Reset your focus'))
    expect(screen.getByText('Step away from the screen for a few minutes.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'I took a break' }))
    expect(alignment.setTaskCompleted).toHaveBeenCalledWith('nutritional-efficiency-break', true)
    expect(alignment.openPractice).not.toHaveBeenCalled()
  })

  it('only the checkbox ticks; the row opens and folds its panel', () => {
    const { onToggle } = renderList()
    const r = row('Help a member')
    expect(r).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(r)
    expect(r).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('alignment-task-panel')).toBeInTheDocument()
    fireEvent.click(r)
    expect(r).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByTestId('alignment-task-collapse')).toHaveAttribute('inert')
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('saves the one thing, ticks the task and shows it on Close the day', () => {
    renderList()
    fireEvent.click(row('Pick your one thing'))
    fireEvent.change(screen.getByLabelText('Your one thing today'), { target: { value: 'Ship the forum fix' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(alignment.setTaskCompleted).toHaveBeenCalledWith('prompt-construction', true)
    expect(readOneThing('member-1', '2026-11-15')).toBe('Ship the forum fix')
    const lines = screen.getAllByTestId('alignment-one-thing-line').map((el) => el.textContent)
    expect(lines).toEqual([' · Ship the forum fix', ' · Your one thing: Ship the forum fix'])
  })

  it('closes the day from a short recap', () => {
    renderList(['silent-synchronization', 'prompt-construction'])
    fireEvent.click(row('Close the day'))
    expect(screen.getByTestId('alignment-day-recap')).toHaveTextContent('2 of 7 tasks done today · 4-day streak')
    fireEvent.click(screen.getByRole('button', { name: 'Close the day' }))
    expect(alignment.setTaskCompleted).toHaveBeenCalledWith('alignment-review', true)
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
})
