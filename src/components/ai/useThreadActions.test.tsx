import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useThreadActions, type ManagedThread, type ThreadPatch } from './useThreadActions'

const { toastErrorMock } = vi.hoisted(() => ({ toastErrorMock: vi.fn() }))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('test-token'),
}))

vi.mock('@/lib/server/api', () => ({
  pinAIThreadFn: vi.fn(),
  archiveAIThreadFn: vi.fn(),
  renameAIThreadFn: vi.fn(),
  deleteAIThreadFn: vi.fn(),
}))

vi.mock('@/components/ui/ToastProvider', () => ({
  useOptionalToast: () => ({
    toast: {
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      error: toastErrorMock,
      hud: vi.fn(),
    },
  }),
}))

import {
  pinAIThreadFn,
  archiveAIThreadFn,
  renameAIThreadFn,
  deleteAIThreadFn,
} from '@/lib/server/api'

const INITIAL_THREADS: ManagedThread[] = [
  { id: 't1', title: 'First Thread', pinnedAt: null, archivedAt: null },
  { id: 't2', title: 'Second Thread', pinnedAt: null, archivedAt: null },
]

const serialize = (overrides: Partial<ManagedThread>) => ({
  id: 't1',
  title: 'First Thread',
  pinnedAt: null,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

const MOCK_THREAD_PINNED = { thread: serialize({ pinnedAt: '2026-01-01T00:00:00Z' }) }
const MOCK_THREAD_UNPINNED = { thread: serialize({ pinnedAt: null }) }
const MOCK_THREAD_RENAMED = { thread: serialize({ title: 'Renamed Thread' }) }
const MOCK_THREAD_ARCHIVED = { thread: serialize({ archivedAt: '2026-01-01T00:00:00Z' }) }

function Harness({
  threads: initialThreads = INITIAL_THREADS,
  onActiveThreadRemoved,
}: {
  threads?: ManagedThread[]
  onActiveThreadRemoved?: (threadId: string) => void
}) {
  const [threads, setThreads] = useState<ManagedThread[]>(initialThreads)

  const applyLocalPatch = (threadId: string, patch: ThreadPatch) => {
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, ...patch } : t)))
  }
  const removeLocalThread = (threadId: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== threadId))
  }
  const restoreLocalThread = (thread: ManagedThread) => {
    setThreads((prev) => (prev.some((t) => t.id === thread.id) ? prev : [...prev, thread]))
  }

  const { pinThread, archiveThread, renameThread, deleteThread } = useThreadActions({
    userId: 'user-1',
    getThreads: () => threads,
    applyLocalPatch,
    removeLocalThread,
    restoreLocalThread,
    onActiveThreadRemoved,
  })

  return (
    <div>
      <div data-testid="titles">{threads.map((t) => t.title).join('|')}</div>
      <div data-testid="pin-state">{threads.map((t) => (t.pinnedAt ? 'pinned' : 'unpinned')).join('|')}</div>
      <button onClick={() => pinThread('t1', true)}>Pin</button>
      <button onClick={() => pinThread('t1', false)}>Unpin</button>
      <button onClick={() => archiveThread('t1', true)}>Archive</button>
      <button onClick={() => renameThread('t1', 'Renamed Thread')}>Rename</button>
      <button onClick={() => deleteThread('t1')}>Delete</button>
    </div>
  )
}

describe('useThreadActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;vi.mocked(pinAIThreadFn).mockReset()
    ;vi.mocked(archiveAIThreadFn).mockReset()
    ;vi.mocked(renameAIThreadFn).mockReset()
    ;vi.mocked(deleteAIThreadFn).mockReset()
  })

  it('optimistically applies pin then reconciles server value', async () => {
    ;vi.mocked(pinAIThreadFn).mockResolvedValue({
      ...MOCK_THREAD_PINNED,
    })

    render(<Harness />)

    fireEvent.click(screen.getByText('Pin'))
    expect(screen.getByTestId('pin-state').textContent).toBe('pinned|unpinned')

    await waitFor(() => {
      expect(pinAIThreadFn).toHaveBeenCalledWith({
        data: { threadId: 't1', pinned: true, token: 'test-token' },
      })
    })
    await waitFor(() => {
      expect(screen.getByTestId('pin-state').textContent).toBe('pinned|unpinned')
    })
  })

  it('rolls back optimistic pin and toasts on server failure', async () => {
    ;vi.mocked(pinAIThreadFn).mockRejectedValue(new Error('network down'))

    render(<Harness />)

    fireEvent.click(screen.getByText('Pin'))
    expect(screen.getByTestId('pin-state').textContent).toBe('pinned|unpinned')

    await waitFor(() => {
      expect(screen.getByTestId('pin-state').textContent).toBe('unpinned|unpinned')
    })
    expect(toastErrorMock).toHaveBeenCalled()
  })

  it('serializes rapid pin toggles so final state matches last click', async () => {
    let resolveFirst: (v: any) => void
    ;vi.mocked(pinAIThreadFn)
      .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce(MOCK_THREAD_UNPINNED)

    render(<Harness />)

    fireEvent.click(screen.getByText('Pin'))
    fireEvent.click(screen.getByText('Unpin'))

    await act(async () => {})

    expect(screen.getByTestId('pin-state').textContent).toBe('pinned|unpinned')

    await act(async () => {
      resolveFirst!(MOCK_THREAD_PINNED)
    })

    await waitFor(() => {
      expect(pinAIThreadFn).toHaveBeenCalledTimes(2)
    })
    await waitFor(() => {
      expect(screen.getByTestId('pin-state').textContent).toBe('unpinned|unpinned')
    })
  })

  it('optimistically renames and applies server title on success', async () => {
    ;vi.mocked(renameAIThreadFn).mockResolvedValue({
      ...MOCK_THREAD_RENAMED,
    })

    render(<Harness />)

    fireEvent.click(screen.getByText('Rename'))
    expect(screen.getByTestId('titles').textContent).toBe('Renamed Thread|Second Thread')

    await waitFor(() => {
      expect(renameAIThreadFn).toHaveBeenCalledWith({
        data: { threadId: 't1', title: 'Renamed Thread', token: 'test-token' },
      })
    })
  })

  it('removes thread locally on delete and notifies active-thread removal', async () => {
    ;vi.mocked(deleteAIThreadFn).mockResolvedValue({ ok: true })
    const onActiveThreadRemoved = vi.fn()

    render(<Harness onActiveThreadRemoved={onActiveThreadRemoved} />)

    fireEvent.click(screen.getByText('Delete'))
    expect(screen.getByTestId('titles').textContent).toBe('Second Thread')
    expect(onActiveThreadRemoved).toHaveBeenCalledWith('t1')

    await waitFor(() => {
      expect(deleteAIThreadFn).toHaveBeenCalledWith({
        data: { threadId: 't1', token: 'test-token' },
      })
    })
  })

  it('restores the thread locally when delete fails', async () => {
    ;vi.mocked(deleteAIThreadFn).mockRejectedValue(new Error('network down'))

    render(<Harness />)

    fireEvent.click(screen.getByText('Delete'))
    expect(screen.getByTestId('titles').textContent).toBe('Second Thread')

    await waitFor(() => {
      expect(screen.getByTestId('titles').textContent).toContain('First Thread')
    })
    expect(toastErrorMock).toHaveBeenCalled()
  })

  it('archives with optimistic patch and clears via callback', async () => {
    ;vi.mocked(archiveAIThreadFn).mockResolvedValue({
      ...MOCK_THREAD_ARCHIVED,
    })
    const onActiveThreadRemoved = vi.fn()

    render(<Harness onActiveThreadRemoved={onActiveThreadRemoved} />)

    fireEvent.click(screen.getByText('Archive'))

    await waitFor(() => {
      expect(archiveAIThreadFn).toHaveBeenCalledWith({
        data: { threadId: 't1', archived: true, token: 'test-token' },
      })
    })
    expect(onActiveThreadRemoved).toHaveBeenCalledWith('t1')
  })
})
