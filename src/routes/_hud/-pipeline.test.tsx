import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import PipelineView from '@/components/hud/PipelineView'
import { getAssetUrl } from '@/lib/assets'
import { calculateProgression } from '@/lib/progression'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: any) => ({ options: opts }),
  Link: ({ children, to, params, hash, ...props }: any) => (
    <a href={`${to.replace('$slug', params?.slug ?? '')}${hash ? `#${hash}` : ''}`} {...props}>
      {children}
    </a>
  ),
}))

const alignment = { progression: calculateProgression(600) }
vi.mock('@/hooks/useDailyAlignment', () => ({
  useDailyAlignment: () => alignment,
}))

describe('Moltology science pipeline', () => {
  beforeEach(() => {
    alignment.progression = calculateProgression(600)
  })

  it('lights the member’s own clearance', () => {
    render(<PipelineView />)

    expect(screen.getByRole('heading', { name: 'The descent' })).toBeInTheDocument()
    expect(screen.getByText('600 XP')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to mine' })).toHaveAttribute('href', '#clearance-L-2')

    const current = document.getElementById('clearance-L-2')!
    expect(current).toHaveAttribute('aria-current', 'step')
    expect(within(current).getByText('You are here')).toBeInTheDocument()
    expect(within(current).getByText('600 XP to L-3')).toBeInTheDocument()
    expect(within(current).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '14')
    expect(within(document.getElementById('clearance-L-1')!).getByText('Cleared')).toBeInTheDocument()
  })

  it('lists every stage and clearance with its rite and readings', () => {
    render(<PipelineView />)

    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'THE LARVAL INITIATE',
      'THE SOFT-SHED',
      'THE EXOSHELL BORN',
      'FULL CARCINIZATION',
      'About the readings',
    ])
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(12)

    const row = document.getElementById('clearance-E-2')!
    expect(within(row).getByText('The Working Standard')).toBeInTheDocument()
    expect(within(row).getByText(/Opens at 18,000 XP/)).toBeInTheDocument()
    expect(within(row).getByText('Shell hardness')).toBeInTheDocument()

    const stage3 = document.getElementById('stage-3')!
    expect(within(stage3).getByRole('link', { name: /Read the scripture/ })).toHaveAttribute('href', expect.stringMatching(/^\/codex\/scr-\d+$/))
  })

  it('jumps to each stage from the contents row', () => {
    render(<PipelineView />)

    const nav = screen.getByRole('navigation', { name: 'Stages' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['#stage-1', '#stage-2', '#stage-3', '#stage-4'])
    expect(links[0]).toHaveAttribute('aria-current', 'step')
    const img = nav.querySelector('img')!
    expect(img.getAttribute('src')).toBe(getAssetUrl('/images/stage1_larval.webp'))
  })

  it('says so at the last clearance', () => {
    alignment.progression = calculateProgression(120000)
    render(<PipelineView />)

    expect(screen.getByText('This is the last clearance.')).toBeInTheDocument()
    expect(document.getElementById('clearance-C-3')).toHaveAttribute('aria-current', 'step')
  })
})
