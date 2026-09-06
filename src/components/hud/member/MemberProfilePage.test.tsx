import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemberProfilePage } from './MemberProfilePage'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
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
  const claimedProfile = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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
    bio: null,
    traits: [],
    joinStory: null,
    referredBy: null,
    bonds: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMemberLoadout.mockResolvedValue({ catalog: [], items: [], totals: {} })
  })

  it('shows the claimed designation, not the shared placeholder', async () => {
    mockGetPublicProfile.mockResolvedValue(claimedProfile)

    render(<MemberProfilePage profileId="member-a" />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'claw_lord' })).toBeInTheDocument()
    })
    expect(screen.getByText('LARVA UNIT #2468')).toBeInTheDocument()
    expect(screen.queryByText('LARVA UNIT #8971')).not.toBeInTheDocument()
  })

  it('shows a workspace ghost while the dossier hydrates', () => {
    mockGetPublicProfile.mockReturnValue(new Promise(() => {}))
    mockGetMemberLoadout.mockReturnValue(new Promise(() => {}))

    render(<MemberProfilePage profileId="member-a" />)

    expect(screen.getByTestId('hud-workspace-ghost')).toBeInTheDocument()
    expect(screen.getByText('Retrieving member dossier.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'claw_lord' })).not.toBeInTheDocument()
  })

  it('canonicalizes a uuid public URL to the stored designation', async () => {
    mockGetPublicProfile.mockResolvedValue(claimedProfile)

    render(
      <MemberProfilePage
        profileId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
        canonicalizePath
      />,
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/member/$profileId',
        params: { profileId: 'claw_lord' },
        replace: true,
      })
    })
  })

  it('does not rewrite /profile self-dossier even when a designation is claimed', async () => {
    mockGetPublicProfile.mockResolvedValue(claimedProfile)

    render(<MemberProfilePage profileId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'claw_lord' })).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('renders join story, traits, and bonds when the dossier has them', async () => {
    mockGetPublicProfile.mockResolvedValue({
      ...claimedProfile,
      bio: 'Initiate working through first ecdysis.',
      joinStory: 'Heard about the Order from Architect Vaelen',
      referredBy: {
        id: '00000000-0000-0000-0000-000000000002',
        displayName: 'Architect Vaelen',
        handle: 'Architect Vaelen',
      },
      traits: [{ id: 'early_questioner', label: 'Early questioner' }],
      bonds: [
        {
          kind: 'mentor',
          label: 'Learning from Architect Vaelen',
          memberId: '00000000-0000-0000-0000-000000000002',
          memberName: 'Architect Vaelen',
          memberHandle: 'Architect Vaelen',
        },
      ],
    })

    render(<MemberProfilePage profileId="member-a" />)

    await waitFor(() => {
      expect(screen.getByText('Initiate working through first ecdysis.')).toBeInTheDocument()
    })
    expect(screen.getByText('Heard about the Order from Architect Vaelen')).toBeInTheDocument()
    expect(screen.getByText('Early questioner')).toBeInTheDocument()
    expect(screen.getByText('Learning from Architect Vaelen')).toBeInTheDocument()
  })
})
