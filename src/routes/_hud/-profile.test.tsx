import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Route } from './profile'
import { authClient } from '@/lib/auth-client'
import { MEMBER_PROFILE_SEO } from '@/lib/seo'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
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
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c'),
}))

describe('/profile own-dossier route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets a real page title and noindex headers', () => {
    const head = Route.options.head as () => { meta: Array<{ title?: string }> }
    const headers = Route.options.headers as () => Record<string, string>
    const meta = head().meta

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
        'Member profiles, loadouts, and friend requests require a signed-in account.',
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

  it('renders the signed-in member dossier with a loading state while data hydrates', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByTestId('hud-workspace-ghost')).toBeInTheDocument()
    expect(screen.getByText('Retrieving member dossier.')).toBeInTheDocument()
  })
})
