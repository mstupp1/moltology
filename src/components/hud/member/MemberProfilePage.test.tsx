import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

const signedIn = {
  user: { id: 'viewer-1' },
  userId: 'viewer-1',
  isPending: false,
  isGuest: false,
  isAuthenticated: true,
}
const guest = { user: null, userId: null, isPending: false, isGuest: true, isAuthenticated: false }
let mockSession: Record<string, unknown> = signedIn

vi.mock('@/hooks/useAuthSession', () => ({
  useAuthSession: () => mockSession,
}))

vi.mock('@/components/AuthModal', () => ({
  AuthModal: () => null,
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
    mockSession = signedIn
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
    expect(screen.queryByTestId('premium-badge')).not.toBeInTheDocument()
  })

  it('shows a Oracle MAX badge only while the membership is active', async () => {
    mockGetPublicProfile.mockResolvedValue({ ...claimedProfile, isPremium: true })

    const { rerender } = render(<MemberProfilePage profileId="member-a" />)

    await waitFor(() => {
      expect(screen.getByTestId('premium-badge')).toHaveTextContent('Oracle MAX')
    })

    mockGetPublicProfile.mockResolvedValue({ ...claimedProfile, isPremium: false })
    rerender(<MemberProfilePage profileId="member-b" />)

    await waitFor(() => {
      expect(screen.queryByTestId('premium-badge')).not.toBeInTheDocument()
    })
  })

  it('shows the dossier to a signed-out visitor with a sign-up prompt instead of friend actions', async () => {
    mockSession = guest
    mockGetPublicProfile.mockResolvedValue(claimedProfile)

    render(<MemberProfilePage profileId="member-a" canonicalizePath />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'claw_lord' })).toBeInTheDocument()
    })
    expect(mockGetPublicProfile).toHaveBeenCalledWith({ data: expect.objectContaining({ profileId: 'member-a' }) })
    expect(mockGetMemberLoadout).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /sign up to add friend/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /build your own/i }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/character' })
  })

  it('shows a workspace ghost while the dossier hydrates', () => {
    mockGetPublicProfile.mockReturnValue(new Promise(() => {}))
    mockGetMemberLoadout.mockReturnValue(new Promise(() => {}))

    render(<MemberProfilePage profileId="member-a" />)

    expect(screen.getByTestId('hud-workspace-ghost')).toBeInTheDocument()
    expect(screen.getByText('Loading member profile.')).toBeInTheDocument()
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

  it('renders the standard circular mascot portrait on profile page', async () => {
    mockGetPublicProfile.mockResolvedValue({
      ...claimedProfile,
      avatarConfig: JSON.stringify({ style: 'critters', seed: 'claw-lord-avatar' }),
    })

    render(<MemberProfilePage profileId="member-a" />)

    await waitFor(() => {
      expect(screen.getByTestId('lobster-avatar-portrait')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('lobster-avatar-full-body')).toBeNull()
    expect(screen.getByTestId('lobster-avatar-portrait').querySelector('[data-renderer="3d"]')).not.toBeNull()
  })

  it('renders uncalibrated carapace silhouette in circular portrait when avatarConfig is null', async () => {
    mockGetPublicProfile.mockResolvedValue({
      ...claimedProfile,
      avatarConfig: null,
    })

    render(<MemberProfilePage profileId="member-a" />)

    await waitFor(() => {
      expect(screen.getByTestId('lobster-avatar-portrait')).toBeInTheDocument()
    })
    expect(screen.queryByText(/no avatar/i)).toBeNull()
    await waitFor(() => {
      expect(screen.getByTestId('lobster-avatar-silhouette')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('lobster-avatar-inline-svg')).toBeNull()
  })
})
