import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
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
    expect(screen.queryByRole('link', { name: 'Go to mine' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Four stages, twelve clearances/)).not.toBeInTheDocument()

    const current = document.getElementById('clearance-L-2')!
    expect(current).toHaveAttribute('aria-current', 'step')
    expect(within(current).getByText('You are here')).toBeInTheDocument()
    expect(within(current).getByText('600 XP to L-3')).toBeInTheDocument()
    expect(within(current).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '14')
    expect(within(document.getElementById('clearance-L-1')!).getByText('Cleared')).toBeInTheDocument()
  })

  it('shows only the selected stage with its three clearances, rite and readings', () => {
    render(<PipelineView />)

    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'THE LARVAL INITIATE',
      'About the readings',
    ])
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: /Stage 3/ }))
    expect(document.getElementById('stage-1')).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)

    const row = document.getElementById('clearance-E-2')!
    expect(within(row).getByText('The Working Standard')).toBeInTheDocument()
    expect(within(row).getByText(/Opens at 18,000 XP/)).toBeInTheDocument()
    expect(within(row).getByText('Shell hardness')).toBeInTheDocument()

    const stage3 = document.getElementById('stage-3')!
    expect(within(stage3).getByRole('link', { name: /Read the scripture/ })).toHaveAttribute('href', expect.stringMatching(/^\/codex\/scr-\d+$/))
  })

  it('exclusively expands each selected stage and keeps the member’s stage marked', () => {
    render(<PipelineView />)

    const nav = screen.getByRole('navigation', { name: 'Stages' })
    const cards = within(nav).getAllByRole('button')
    expect(cards).toHaveLength(4)
    expect(cards[0]).toHaveAttribute('aria-current', 'step')
    expect(cards[0]).toHaveAttribute('aria-expanded', 'true')
    expect(Array.from(nav.querySelectorAll('img'), (img) => img.getAttribute('src'))).toEqual([
      'larval', 'soft-shed', 'exoshell', 'ascendant',
    ].map((name) => getAssetUrl(`images/dashboard/stages/${name}-v1.png`)))

    for (const index of [1, 3, 2, 0]) {
      fireEvent.click(cards[index])
      expect(within(nav).getAllByRole('button', { expanded: true })).toEqual([cards[index]])
      expect(document.querySelectorAll('#pipeline-stage-details > section')).toHaveLength(1)
      expect(document.getElementById(`stage-${index + 1}`)).toBeInTheDocument()
      expect(cards[index]).toHaveAttribute('aria-controls', 'pipeline-stage-details')
      expect(cards[0]).toHaveAttribute('aria-current', 'step')
      expect(within(nav).getByText(/Yours/)).toBeInTheDocument()
      fireEvent.click(cards[index])
      expect(cards[index]).toHaveAttribute('aria-expanded', 'true')
    }
  })

  it('follows loaded progression until the member chooses a stage', () => {
    alignment.progression = calculateProgression(0)
    const { rerender } = render(<PipelineView />)
    alignment.progression = calculateProgression(18000)
    rerender(<PipelineView />)
    expect(screen.getByRole('button', { name: /Stage 3/ })).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: /Stage 2/ }))
    alignment.progression = calculateProgression(120000)
    rerender(<PipelineView />)
    expect(screen.getByRole('button', { name: /Stage 2/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /Stage 4/ })).toHaveAttribute('aria-current', 'step')
    expect(document.getElementById('stage-4')).not.toBeInTheDocument()
  })

  it('opens the current stage again when the page is reopened', () => {
    const { unmount } = render(<PipelineView />)
    fireEvent.click(screen.getByRole('button', { name: /Stage 3/ }))
    unmount()
    render(<PipelineView />)
    expect(screen.getByRole('button', { name: /Stage 1/ })).toHaveAttribute('aria-expanded', 'true')
  })

  it('says so at the last clearance', () => {
    alignment.progression = calculateProgression(120000)
    render(<PipelineView />)

    expect(screen.getByText('This is the last clearance.')).toBeInTheDocument()
    expect(document.getElementById('clearance-C-3')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: /Stage 4/ })).toHaveAttribute('aria-expanded', 'true')
  })
})
