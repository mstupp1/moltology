import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Route } from './profile'
import { authClient } from '@/lib/auth-client'
import { MEMBER_PROFILE_SEO, memberProfileSeo } from '@/lib/seo'

const mockNavigate = vi.fn()
let mockSearch: { tab?: string } = {}

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearch: () => mockSearch,
    Link: ({ children, to, search, replace: _replace, ...props }: any) => (
      <a href={search?.tab ? `${to}?tab=${search.tab}` : to} {...props}>
        {children}
      </a>
    ),
  }
})

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/lib/server/api', () => ({
  getPublicProfileFn: vi.fn().mockReturnValue(new Promise(() => {})),
  getMemberLoadoutFn: vi.fn().mockReturnValue(new Promise(() => {})),
  listConnectionsFn: vi.fn().mockResolvedValue({ incoming: [{ userId: 'a' }], friends: [], sent: [] }),
}))

vi.mock('@/components/hud/ActivityStreamPage', () => ({
  ActivityStreamPage: () => <div>activity feed</div>,
}))

vi.mock('@/components/hud/connections/ConnectionsPage', () => ({
  ConnectionsPage: ({ view, tab }: { view: string; tab?: string }) => <div>{`connections ${view} ${tab}`}</div>,
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c'),
}))

describe('/profile own-dossier route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearch = {}
  })

  it('sets a real page title and noindex headers', () => {
    const head = Route.options.head as () => { meta: Array<{ title?: string }> }
    const headers = Route.options.headers as () => Record<string, string>
    const meta = head().meta

    expect(meta).toEqual(
      expect.arrayContaining(memberProfileSeo()),
    )
    expect(meta).toEqual(
      expect.arrayContaining([{ title: MEMBER_PROFILE_SEO.title }]),
    )
    expect(headers()['X-Robots-Tag']).toBe('noindex, nofollow')
    expect(Route.options.pendingComponent).toBeDefined()
  })

  it('renders guest lock screen when unauthenticated', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('MEMBER PROFILES LOCKED')).toBeInTheDocument()
    expect(screen.getByText('RESTRICTED ACCESS')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Your profile, activity, friends and friend requests need a signed-in account.',
      ),
    ).toBeInTheDocument()
  })

  it('holds the workspace ghost for the first-paint empty session shape', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByTestId('hud-workspace-ghost')).toBeInTheDocument()
    expect(screen.queryByText('MEMBER PROFILES LOCKED')).not.toBeInTheDocument()
  })

  it('renders the signed-in member dossier with a loading state while data hydrates', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByTestId('hud-workspace-ghost')).toBeInTheDocument()
    expect(await screen.findByText('Retrieving member dossier.')).toBeInTheDocument()
  })

  it('links the four profile sections and marks the open one', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: { user: { id: 'user-1' } } } as any)
    mockSearch = { tab: 'friends' }
    const Component = Route.options.component!
    render(<Component />)

    const nav = screen.getByRole('navigation', { name: 'Profile sections' })
    const links = Array.from(nav.querySelectorAll('a'))
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/profile',
      '/profile?tab=activity',
      '/profile?tab=friends',
      '/profile?tab=incoming',
    ])
    expect(links[2]).toHaveAttribute('aria-current', 'page')
    expect(await screen.findByText('connections friends friends')).toBeInTheDocument()
    // The Requests link counts waiting requests once they load.
    expect(await screen.findByText('1')).toBeInTheDocument()
  })

  it.each([
    ['activity', 'activity feed'],
    ['incoming', 'connections requests incoming'],
    ['sent', 'connections requests sent'],
  ])('opens the %s tab', async (tab, text) => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: { user: { id: 'user-1' } } } as any)
    mockSearch = { tab }
    const Component = Route.options.component!
    render(<Component />)
    expect(await screen.findByText(text)).toBeInTheDocument()
  })

  it('reads the tab from the address, maps the old feed tab and ignores unknown ones', () => {
    const validate = Route.options.validateSearch as (search: Record<string, unknown>) => { tab?: string }
    expect(validate({ tab: 'incoming' })).toEqual({ tab: 'incoming' })
    expect(validate({ tab: 'feed' })).toEqual({ tab: 'activity' })
    expect(validate({ tab: 'nope' })).toEqual({ tab: undefined })
  })
})
