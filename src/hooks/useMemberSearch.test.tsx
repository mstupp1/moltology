import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { useMemberSearch } from './useMemberSearch'
import { searchMembersFn } from '@/lib/server/api'
import { MEMBER_SEARCH_DEBOUNCE_MS } from '@/lib/member-search'

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt'),
}))

vi.mock('@/lib/server/api', () => ({
  searchMembersFn: vi.fn(),
}))

function Probe({ query, enabled }: { query: string; enabled: boolean }) {
  const { results, searching } = useMemberSearch(query, enabled)
  return (
    <div>
      <span data-testid="searching">{String(searching)}</span>
      <span data-testid="count">{results.length}</span>
      <span data-testid="first">{results[0]?.displayName ?? ''}</span>
    </div>
  )
}

describe('useMemberSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(searchMembersFn).mockResolvedValue([
      {
        id: 'member-claw',
        larvaId: 'LARVA UNIT #9',
        handle: 'claw_lord',
        displayName: 'claw_lord',
        stage: 2,
        stageLabel: 'Soft-Shed',
        avatarConfig: null,
      },
    ])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call the people API until two characters and the caller is enabled', async () => {
    render(
      <ToastProvider>
        <Probe query="c" enabled />
      </ToastProvider>,
    )
    expect(searchMembersFn).not.toHaveBeenCalled()

    render(
      <ToastProvider>
        <Probe query="claw" enabled={false} />
      </ToastProvider>,
    )
    expect(searchMembersFn).not.toHaveBeenCalled()
  })

  it('debounces and ranks handle-aware results from searchMembersFn', async () => {
    vi.useFakeTimers()
    render(
      <ToastProvider>
        <Probe query="claw" enabled />
      </ToastProvider>,
    )
    expect(searchMembersFn).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(MEMBER_SEARCH_DEBOUNCE_MS)
    await waitFor(() => {
      expect(screen.getByTestId('first')).toHaveTextContent('claw_lord')
    })
    expect(searchMembersFn).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('count')).toHaveTextContent('1')
  })
})
