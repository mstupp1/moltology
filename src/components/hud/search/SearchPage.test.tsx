import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchPage } from './SearchPage'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { authClient } from '@/lib/auth-client'
import { searchMembersFn, listConnectionsFn } from '@/lib/server/api'

const mockNavigate = vi.fn()
const onQueryChange = vi.fn()
const onTypeChange = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, params }: any) => (
    <a href={typeof to === 'string' ? to : '/member'} data-profile={params?.profileId}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt'),
}))

vi.mock('@/lib/server/api', () => ({
  searchMembersFn: vi.fn(),
  listConnectionsFn: vi.fn(),
}))

vi.mock('@/components/hud/LobsterAvatarPortrait', () => ({
  LobsterAvatarPortrait: () => <div data-testid="avatar" />,
}))

vi.mock('@/components/hud/member/FriendRequestButton', () => ({
  FriendRequestButton: () => <button type="button">Request</button>,
}))

const clawLord = {
  id: 'member-claw',
  larvaId: 'LARVA UNIT #9',
  handle: 'claw_lord',
  displayName: 'claw_lord',
  stage: 2,
  stageLabel: 'Soft-Shed',
  avatarConfig: null,
}

function renderSearch(props?: Partial<React.ComponentProps<typeof SearchPage>>) {
  return render(
    <ToastProvider>
      <div>
        <aside data-testid="hud-sidebar">
          <a href="/dashboard">Command Hub</a>
        </aside>
        <SearchPage
          query={props?.query ?? ''}
          type={props?.type ?? 'people'}
          onQueryChange={props?.onQueryChange ?? onQueryChange}
          onTypeChange={props?.onTypeChange ?? onTypeChange}
        />
      </div>
    </ToastProvider>,
  )
}

function queryViewportLock() {
  return document.querySelector('.fixed.inset-0.z-50')
}

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1' } },
      isPending: false,
    } as any)
    vi.mocked(searchMembersFn).mockResolvedValue([clawLord])
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
      incoming: [],
      outgoing: [],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows People and Pages tabs without saying Users or 0 results', () => {
    renderSearch({ query: 'zz', type: 'people' })
    expect(screen.getByRole('button', { name: /People/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pages/i })).toBeInTheDocument()
    expect(screen.queryByText(/Users/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/0 results/i)).not.toBeInTheDocument()
  })

  it('loads people through searchMembersFn and renders the Connections member row', async () => {
    renderSearch({ query: 'claw', type: 'people' })
    await waitFor(() => {
      expect(screen.getByText('claw_lord')).toBeInTheDocument()
    })
    expect(screen.getByText(/Stage 2/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Request' })).toBeInTheDocument()
    expect(screen.getByText('claw_lord').closest('a')).toHaveAttribute('data-profile', 'claw_lord')
    expect(screen.queryByTestId('people-search-guest-lock')).not.toBeInTheDocument()
    expect(searchMembersFn).toHaveBeenCalled()
  })

  it('filters the shared command list on the Pages tab', () => {
    renderSearch({ query: 'Codex', type: 'pages' })
    expect(screen.getByText('Open Sacred Codex & Canonical Scriptures')).toBeInTheDocument()
    expect(screen.queryByText('Open Subterranean Vats & Level -7 Bio-Vault')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Open Sacred Codex & Canonical Scriptures'))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/codex' })
  })

  it('surfaces HUD chambers and news dispatches on Pages for obvious queries', () => {
    renderSearch({ query: 'oracle', type: 'pages' })
    expect(screen.getByText('Consult the Synaptic Oracle')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Consult the Synaptic Oracle'))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/oracle' })

    renderSearch({ query: 'connections', type: 'pages' })
    expect(screen.getByText('Open Connections & Fellow Shells')).toBeInTheDocument()

    renderSearch({ query: 'news', type: 'pages' })
    expect(screen.getByText('Open MoltNation News')).toBeInTheDocument()
    expect(screen.getAllByText(/Read Dispatch:/).length).toBeGreaterThan(0)
  })

  it('locks people search for guests while pages stay reachable', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
    renderSearch({ query: 'claw', type: 'people' })
    expect(screen.getByTestId('people-search-guest-lock')).toBeInTheDocument()
    expect(screen.getByText('MEMBER SEARCH LOCKED')).toBeInTheDocument()
    expect(screen.queryByText('claw_lord')).not.toBeInTheDocument()
    expect(screen.queryByTestId('avatar')).not.toBeInTheDocument()
    expect(queryViewportLock()).toBeNull()
    expect(searchMembersFn).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Pages/i }))
    expect(onTypeChange).toHaveBeenCalledWith('pages')

    const sidebarLink = screen.getByRole('link', { name: 'Command Hub' })
    expect(sidebarLink).toBeVisible()
    fireEvent.click(sidebarLink)
    expect(sidebarLink).toHaveAttribute('href', '/dashboard')

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search query' }), {
      target: { value: 'Codex' },
    })
    expect(onQueryChange).toHaveBeenCalledWith('Codex')

    renderSearch({ query: 'Codex', type: 'pages' })
    expect(screen.getByText('Open Sacred Codex & Canonical Scriptures')).toBeInTheDocument()
    expect(screen.queryByText('claw_lord')).not.toBeInTheDocument()
    expect(queryViewportLock()).toBeNull()
  })

  it('holds people results while the session is pending and keeps chrome clickable', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
    renderSearch({ query: 'claw', type: 'people' })
    expect(screen.getByTestId('people-search-pending')).toBeInTheDocument()
    expect(screen.queryByText('MEMBER SEARCH LOCKED')).not.toBeInTheDocument()
    expect(screen.queryByText('claw_lord')).not.toBeInTheDocument()
    expect(queryViewportLock()).toBeNull()
    expect(searchMembersFn).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Pages/i }))
    expect(onTypeChange).toHaveBeenCalledWith('pages')
    expect(screen.getByRole('link', { name: 'Command Hub' })).toBeVisible()
  })

  it('opens sign-in from the inline people lock without covering the tabs', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
    renderSearch({ query: 'claw', type: 'people' })
    fireEvent.click(screen.getByRole('button', { name: /Already have an account\? Sign In/i }))
    expect(screen.getByRole('heading', { name: /WELCOME BACK/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pages/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Command Hub' })).toBeVisible()
  })

  it('uses warm empty copy when no people surface', async () => {
    vi.mocked(searchMembersFn).mockResolvedValue([])
    renderSearch({ query: 'zz', type: 'people' })
    await waitFor(() => {
      expect(screen.getByText(/The trench stayed quiet/)).toBeInTheDocument()
    })
    expect(screen.queryByText(/0 results/i)).not.toBeInTheDocument()
  })
})
