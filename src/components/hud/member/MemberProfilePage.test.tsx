import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemberProfilePage } from './MemberProfilePage'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={typeof to === 'string' ? to : '/connections'} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt'),
}))

const mockGetPublicProfile = vi.fn()
const mockGetMemberLoadout = vi.fn()

vi.mock('@/lib/server/api', () => ({
  getPublicProfileFn: (...args: any[]) => mockGetPublicProfile(...args),
  getMemberLoadoutFn: (...args: any[]) => mockGetMemberLoadout(...args),
}))

vi.mock('./FriendRequestButton', () => ({
  FriendRequestButton: () => <button type="button">Request</button>,
}))

describe('MemberProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMemberLoadout.mockResolvedValue({ catalog: [], items: [], totals: {} })
  })

  it('shows the claimed designation, not the shared placeholder', async () => {
    mockGetPublicProfile.mockResolvedValue({
      id: 'member-a',
      larvaId: 'LARVA UNIT #2468',
      handle: 'claw_lord',
      displayName: 'claw_lord',
      stage: 1,
      stageLabel: 'Larval Initiate',
      avatarConfig: null,
      memberSince: '2026-08-01T00:00:00.000Z',
      stats: null,
      moltmax: null,
      relationship: 'none',
      pendingRequestId: null,
    })

    render(<MemberProfilePage profileId="member-a" />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'claw_lord' })).toBeInTheDocument()
    })
    expect(screen.getByText('LARVA UNIT #2468')).toBeInTheDocument()
    expect(screen.queryByText('LARVA UNIT #8971')).not.toBeInTheDocument()
  })
})
