import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PodcastPlayer } from '../../components/podcast/PodcastPlayer'
import { INITIAL_PODCASTS } from '../../lib/podcast-data'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({ component: () => null }),
}))

// Mock API functions
vi.mock('../../lib/server/api', () => ({
  getPodcastsFn: vi.fn().mockResolvedValue(INITIAL_PODCASTS),
}))

describe('PodcastPlayer Component', () => {
  it('renders episode metadata and default 1.2x playback rate indicator', () => {
    const episode = INITIAL_PODCASTS[0]
    render(<PodcastPlayer episode={episode} />)

    expect(screen.getByText(episode.title)).toBeDefined()
    expect(screen.getByText('1.2x DEFAULTRATE')).toBeDefined()
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
})
