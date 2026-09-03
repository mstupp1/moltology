import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThreadList } from './ThreadList'

vi.mock('@/components/ui/HudBottomSheet', () => ({
  HudBottomSheet: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? <div data-testid="action-sheet">{children}</div> : null,
}))

const THREADS = [
  { id: 't1', title: 'Active Chat', pinnedAt: null, archivedAt: null },
  { id: 't2', title: 'Pinned Chat', pinnedAt: '2026-01-01T00:00:00Z', archivedAt: null },
  { id: 't3', title: 'Archived Chat', pinnedAt: null, archivedAt: '2026-01-01T00:00:00Z' },
]

const noop = () => {}

function renderList(overrides: Partial<Parameters<typeof ThreadList>[0]> = {}) {
  const onPin = vi.fn()
  const onArchive = vi.fn()
  const onRename = vi.fn()
  const onDelete = vi.fn()
  const onSelectThread = vi.fn()

  render(
    <ThreadList
      threads={THREADS}
      activeThreadId="t1"
      isLoadingThreads={false}
      onSelectThread={onSelectThread}
      onPin={onPin}
      onArchive={onArchive}
      onRename={onRename}
      onDelete={onDelete}
      {...overrides}
    />
  )

  return { onPin, onArchive, onRename, onDelete, onSelectThread }
}

describe('ThreadList', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders active threads with pin indicator on pinned rows', () => {
    renderList()
    expect(screen.getByText('Active Chat')).toBeInTheDocument()
    expect(screen.getByText('Pinned Chat')).toBeInTheDocument()
    expect(screen.queryByText('Archived Chat')).not.toBeInTheDocument()
  })

  it('uses comfortable row padding when density is comfortable', () => {
    renderList({ density: 'comfortable' })
    const title = screen.getByText('Active Chat')
    expect(title.closest('[data-density="comfortable"]')).toBeTruthy()
    expect(title.closest('button')?.className).toContain('py-3')
  })

  it('selects a thread when the row title is clicked', () => {
    const { onSelectThread } = renderList()
    fireEvent.click(screen.getByText('Pinned Chat'))
    expect(onSelectThread).toHaveBeenCalledWith('t2')
  })

  it('shows the collapsed archived section and expands on toggle', () => {
    renderList()
    const toggle = screen.getByRole('button', { name: /archived/i })
    expect(toggle).toBeInTheDocument()
    expect(screen.queryByText('Archived Chat')).not.toBeInTheDocument()

    fireEvent.click(toggle)
    expect(screen.getByText('Archived Chat')).toBeInTheDocument()
  })

  it('opens the mobile action sheet from the kebab and pins from it', async () => {
    const { onPin } = renderList()
    const kebabs = screen.getAllByTestId('thread-kebab-mobile')
    fireEvent.click(kebabs[0])

    await waitFor(() => {
      expect(screen.getByTestId('action-sheet')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Pin to top'))
    expect(onPin).toHaveBeenCalledWith('t1', true)
  })

  it('unarchives from the action sheet for archived rows', async () => {
    const { onArchive } = renderList()
    fireEvent.click(screen.getByRole('button', { name: /archived/i }))
    const kebabs = screen.getAllByTestId('thread-kebab-mobile')
    fireEvent.click(kebabs[kebabs.length - 1])

    await waitFor(() => {
      expect(screen.getByTestId('action-sheet')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Unarchive'))
    expect(onArchive).toHaveBeenCalledWith('t3', false)
  })

  it('asks for confirmation before delete and deletes on confirm', async () => {
    const { onDelete } = renderList()
    const kebabs = screen.getAllByTestId('thread-kebab-mobile')
    fireEvent.click(kebabs[0])

    await waitFor(() => {
      expect(screen.getByTestId('action-sheet')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Delete chat'))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Delete chat confirmation' })).toBeInTheDocument()
    })
    expect(onDelete).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'DELETE' }))
    expect(onDelete).toHaveBeenCalledWith('t1')
  })

  it('skips confirmation when the dont-ask-again preference is stored', async () => {
    localStorage.setItem('moltology:oracle_skip_delete_confirm', 'true')
    const { onDelete } = renderList()
    const kebabs = screen.getAllByTestId('thread-kebab-mobile')
    fireEvent.click(kebabs[0])

    await waitFor(() => {
      expect(screen.getByTestId('action-sheet')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Delete chat'))

    expect(onDelete).toHaveBeenCalledWith('t1')
    expect(screen.queryByRole('dialog', { name: 'Delete chat confirmation' })).not.toBeInTheDocument()
  })

  it('starts inline rename from the action sheet and commits on Enter', async () => {
    const { onRename } = renderList()
    const kebabs = screen.getAllByTestId('thread-kebab-mobile')
    fireEvent.click(kebabs[0])

    await waitFor(() => {
      expect(screen.getByTestId('action-sheet')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Rename'))

    await waitFor(() => {
      expect(screen.getByLabelText('Rename chat')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Rename chat') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Fresh Title' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onRename).toHaveBeenCalledWith('t1', 'Fresh Title')
  })

  it('hides pin and rename actions for archived threads in the sheet', async () => {
    renderList()
    fireEvent.click(screen.getByRole('button', { name: /archived/i }))
    const kebabs = screen.getAllByTestId('thread-kebab-mobile')
    fireEvent.click(kebabs[kebabs.length - 1])

    await waitFor(() => {
      expect(screen.getByTestId('action-sheet')).toBeInTheDocument()
    })
    expect(screen.queryByText('Pin to top')).not.toBeInTheDocument()
    expect(screen.queryByText('Rename')).not.toBeInTheDocument()
    expect(screen.getByText('Unarchive')).toBeInTheDocument()
  })
})
