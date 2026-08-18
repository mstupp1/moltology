import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PodcastPlayer } from '../../components/podcast/PodcastPlayer'
import { INITIAL_PODCASTS } from '../../lib/podcast-data'
import { Route } from './podcasts'
import { authClient } from '@/lib/auth-client'

// Mock API functions
vi.mock('../../lib/server/api', () => ({
  getPodcastsFn: vi.fn().mockResolvedValue(INITIAL_PODCASTS),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

describe('Podcasts HUD Route & PodcastPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders episode metadata and default 1.2x playback rate indicator', () => {
    const episode = INITIAL_PODCASTS[0]
    render(<PodcastPlayer episode={episode} />)

    expect(screen.getByText(episode.title)).toBeDefined()
    expect(screen.getByText('1.2X PATRIOT SPEED')).toBeDefined()
    expect(screen.getByText('1.2x')).toBeDefined()
  })

  it('contains play, skip, and transcript buttons', () => {
    const episode = INITIAL_PODCASTS[0]
    render(<PodcastPlayer episode={episode} />)

    expect(screen.getByTitle('Play')).toBeDefined()
    expect(screen.getByTitle('Rewind 15 seconds')).toBeDefined()
    expect(screen.getByTitle('Forward 15 seconds')).toBeDefined()
    expect(screen.getByTitle('View Transcript')).toBeDefined()
  })

  it('renders guest lock screen when unauthenticated', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('BENTHIC PODCASTS LOCKED')).toBeInTheDocument()
    expect(screen.getByText('RESTRICTED ACCESS')).toBeInTheDocument()
    expect(
      screen.getByText('Sub-oceanic transmissions and MoltNation podcast audio streams require an authorized initiate account.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SIGN UP TO UNLOCK/i })).toBeInTheDocument()
  })

  it('renders full podcast page when authenticated', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('MOLTNATION PODCASTS')).toBeInTheDocument()
    expect(screen.getByText('NOW PLAYING TRANSMISSION')).toBeInTheDocument()
  })
})
