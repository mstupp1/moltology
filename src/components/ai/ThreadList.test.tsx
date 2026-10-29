import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { ThreadList } from './ThreadList'

const THREADS = [
  { id: 't1', title: 'Active Chat', pinnedAt: null, archivedAt: null },
  { id: 't2', title: 'Pinned Chat', pinnedAt: '2026-01-01T00:00:00Z', archivedAt: null },
  { id: 't3', title: 'Archived Chat', pinnedAt: null, archivedAt: '2026-01-01T00:00:00Z' },
]

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

function kebabFor(title: string) {
  const titleEl = screen.getByText(title)
  const row = titleEl.closest('[data-density]')
  return row?.querySelector('button') as HTMLElement
}

function touchPointer(target: HTMLElement, type: string, x = 20, y = 20) {
  const event = new Event(type === 'pointerleave' ? 'pointerout' : type, { bubbles: true, cancelable: true })
  Object.assign(event, { pointerType: 'touch', pointerId: 1, isPrimary: true, clientX: x, clientY: y })
  fireEvent(target, event)
}

describe('ThreadList', () => {
  it('filters from an external query without rendering the built-in search field', () => {
    renderList({ searchThreshold: 0, searchQuery: 'Pinned' })
    expect(screen.getByText('Pinned Chat')).toBeInTheDocument()
    expect(screen.queryByText('Active Chat')).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  afterEach(() => { vi.useRealTimers() })

  beforeEach(() => {
    localStorage.clear()
  })

  it('renders pinned threads in a labeled section above unpinned threads', () => {
    renderList()
    const pinned = screen.getByTestId('pinned-threads')
    const unpinned = screen.getByTestId('unpinned-threads')
    expect(within(pinned).getByText('Pinned')).toBeInTheDocument()
    expect(within(pinned).getByText('Pinned Chat')).toBeInTheDocument()
    expect(within(pinned).queryByText('Active Chat')).not.toBeInTheDocument()
    expect(within(unpinned).getByText('Active Chat')).toBeInTheDocument()
    expect(pinned.compareDocumentPosition(unpinned) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByText('Archived Chat')).not.toBeInTheDocument()
  })

  it('sorts pinned threads with the most recently pinned first', () => {
    renderList({
      threads: [
        { id: 't-old', title: 'Older Pin', pinnedAt: '2026-01-01T00:00:00Z', archivedAt: null },
        { id: 't-new', title: 'Newer Pin', pinnedAt: '2026-06-01T00:00:00Z', archivedAt: null },
        { id: 't-active', title: 'Active Chat', pinnedAt: null, archivedAt: null },
      ],
    })
    const pinned = screen.getByTestId('pinned-threads')
    const text = pinned.textContent || ''
    expect(text.indexOf('Newer Pin')).toBeGreaterThan(-1)
    expect(text.indexOf('Newer Pin')).toBeLessThan(text.indexOf('Older Pin'))
  })

  it('uses tighter single-line rows and matching options controls when density is comfortable', () => {
    renderList({ density: 'comfortable' })
    const title = screen.getByText('Active Chat')
    expect(title.closest('[data-density="comfortable"]')).toBeTruthy()
    expect(title.closest('button')).toHaveClass('min-h-8', 'py-1.5', 'text-sm')
    expect(screen.getAllByRole('button', { name: 'Chat options' })[0]).toHaveClass('h-8', 'w-8')
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

  it('opens the anchored dropdown after holding for 500ms and suppresses the selection click', () => {
    vi.useFakeTimers()
    const { onSelectThread } = renderList()
    const row = kebabFor('Active Chat')
    touchPointer(row, 'pointerdown')
    act(() => { vi.advanceTimersByTime(499) })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.queryByTestId('thread-kebab-mobile')).not.toBeInTheDocument()
    touchPointer(row, 'pointerup')
    fireEvent.click(row)
    expect(onSelectThread).not.toHaveBeenCalled()
  })

  it.each(['pointerup', 'pointercancel', 'pointermove', 'pointerleave'])(
    'cancels a pending hold on %s so scrolling and normal taps do not open a menu', (event) => {
      vi.useFakeTimers()
      const { onSelectThread } = renderList()
      const row = kebabFor('Active Chat')
      touchPointer(row, 'pointerdown')
      act(() => { vi.advanceTimersByTime(200) })
      touchPointer(row, event, 40, 40)
      act(() => { vi.advanceTimersByTime(500) })
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      if (event === 'pointerup') {
        fireEvent.click(row)
        expect(onSelectThread).toHaveBeenCalledWith('t1')
      }
    },
  )

  it('keeps desktop options and keyboard context menus available', () => {
    renderList()
    const row = kebabFor('Active Chat')
    const trigger = row.closest('[data-density]')!.querySelector('[data-testid="thread-kebab-desktop"]')!
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' })
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    fireEvent.keyDown(row, { key: 'F10', shiftKey: true })
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('opens the row dropdown from the context menu and pins from it', async () => {
    const { onPin } = renderList()
    fireEvent.contextMenu(kebabFor('Active Chat'))

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('menuitem', { name: 'Pin' }))
    expect(onPin).toHaveBeenCalledWith('t1', true)
  })

  it('unarchives from the dropdown for archived rows', async () => {
    const { onArchive } = renderList()
    fireEvent.click(screen.getByRole('button', { name: /archived/i }))
    fireEvent.contextMenu(kebabFor('Archived Chat'))

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Unarchive'))
    expect(onArchive).toHaveBeenCalledWith('t3', false)
  })

  it('asks for confirmation before delete and deletes on confirm', async () => {
    const { onDelete } = renderList()
    fireEvent.contextMenu(kebabFor('Active Chat'))

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))

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
    fireEvent.contextMenu(kebabFor('Active Chat'))

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(onDelete).toHaveBeenCalledWith('t1')
    expect(screen.queryByRole('dialog', { name: 'Delete chat confirmation' })).not.toBeInTheDocument()
  })

  it('starts inline rename from the dropdown and commits on Enter', async () => {
    const { onRename } = renderList()
    fireEvent.contextMenu(kebabFor('Active Chat'))

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument()
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

  it('hides pin and rename actions for archived threads in the dropdown', async () => {
    renderList()
    fireEvent.click(screen.getByRole('button', { name: /archived/i }))
    fireEvent.contextMenu(kebabFor('Archived Chat'))

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })
    expect(screen.queryByRole('menuitem', { name: 'Pin' })).not.toBeInTheDocument()
    expect(screen.queryByText('Rename')).not.toBeInTheDocument()
    expect(screen.getByText('Unarchive')).toBeInTheDocument()
  })
})
