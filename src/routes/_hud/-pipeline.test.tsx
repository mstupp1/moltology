import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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

  it('opens on the member’s own clearance', () => {
    render(<PipelineView />)

    expect(screen.getByRole('heading', { name: 'The descent' })).toBeInTheDocument()
    expect(screen.getByText('600 XP')).toBeInTheDocument()

    const tab = screen.getByRole('tab', { name: /L-2 Shell Sprout, you are here/ })
    expect(tab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /L-1 Molt Curious, cleared/ })).toHaveAttribute('aria-selected', 'false')

    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByRole('heading', { level: 2 })).toHaveTextContent('L-2 Shell Sprout')
    expect(within(panel).getByText(/600 XP to L-3/)).toBeInTheDocument()
  })

  it('lists all twelve clearances and scans one when picked', () => {
    render(<PipelineView />)

    expect(screen.getAllByRole('tab')).toHaveLength(12)
    fireEvent.click(screen.getByRole('tab', { name: /E-2 Hydraulic Grip/ }))

    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByRole('heading', { level: 2 })).toHaveTextContent('E-2 Hydraulic Grip')
    expect(within(panel).getByText(/Opens at 18,000 XP\. 17,400 XP to go\./)).toBeInTheDocument()
    expect(within(panel).getByText('The Working Standard')).toBeInTheDocument()

    const img = within(panel).getByAltText('the exoshell born specimen') as HTMLImageElement
    expect(img.src).toBe(getAssetUrl('/images/stage3_exoshell.webp'))
    expect(within(panel).getByRole('link', { name: /Stage 3 scripture/ })).toHaveAttribute('href', expect.stringMatching(/^\/codex\/scr-\d+$/))
  })

  it('moves along the rail with the arrow keys', () => {
    render(<PipelineView />)

    fireEvent.keyDown(screen.getByRole('tab', { name: /L-2/ }), { key: 'ArrowDown' })
    expect(screen.getByRole('tab', { name: /L-3/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /L-3/ })).toHaveFocus()

    fireEvent.keyDown(screen.getByRole('tab', { name: /L-3/ }), { key: 'End' })
    expect(screen.getByRole('tab', { name: /C-3/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('jumps to a stage from the strata row', () => {
    render(<PipelineView />)

    fireEvent.click(screen.getByRole('button', { name: /Stage 4/ }))
    expect(screen.getByRole('tab', { name: /C-1 Mind Carapace/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches the scan lens and opens hotspot readings', () => {
    render(<PipelineView />)

    const xray = screen.getByRole('radio', { name: 'X-ray' })
    fireEvent.click(xray)
    expect(xray).toHaveAttribute('aria-checked', 'true')

    const hotspot = screen.getByRole('button', { name: 'Scan Pincer Torque' })
    fireEvent.click(hotspot)
    expect(hotspot).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByText('Finishing the thing you started.').length).toBeGreaterThan(1)
  })

  it('projects when the next clearance opens at the chosen pace', () => {
    render(<PipelineView />)

    // 600 XP at 8 a day: 100 XP a day plus the 3-day streak bonus reaches 1,200 XP on day 6.
    expect(screen.getByText(/At 8 a day,/).textContent).toContain('L-3 First Calcification opens in 6 days')

    fireEvent.click(screen.getByRole('radio', { name: '2 a day' }))
    // 20 XP a day, no streak bonus: 600 more XP takes 30 days.
    expect(screen.getByText(/At 2 a day,/).textContent).toContain('opens in 30 days')

    fireEvent.click(screen.getByRole('button', { name: /Scan S-3 Sub-Dermal Weave/ }))
    expect(screen.getByRole('tab', { name: /S-3/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('says so at the floor', () => {
    alignment.progression = calculateProgression(120000)
    render(<PipelineView />)

    expect(screen.getByText('You are here. This is the floor.')).toBeInTheDocument()
    expect(screen.getByText(/You have reached the floor/)).toBeInTheDocument()
  })
})
