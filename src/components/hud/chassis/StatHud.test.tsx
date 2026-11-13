import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { StatHud } from './StatHud'
import { buildVectorSheet, emptyVectors, VECTORS } from '@/lib/vectors'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const base = {
  source: 'audit' as const,
  values: { shellHardness: 57, pincerTorque: 46, neuralLatency: 58, ecdysisDiscipline: 53, depthTolerance: 43 },
}
const gear = { ...emptyVectors(), shellHardness: 4, pincerTorque: 2 }

function sheet() {
  return buildVectorSheet(base, gear)
}

describe('StatHud', () => {
  it('names every stat on wide screens and explains it in the guide', () => {
    render(<StatHud variant="strip" sheet={sheet()} />)
    for (const v of Object.values(VECTORS)) expect(screen.getAllByText(v.label).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByTestId('stat-hud-pincerTorque'))
    const dialog = screen.getByRole('dialog', { name: 'What the Moltmax stats mean' })
    expect(dialog).toHaveTextContent(VECTORS.depthTolerance.description)
    expect(dialog).toHaveTextContent('Raised by pincer gear.')
    expect(screen.getByTestId('stat-guide-pincerTorque').className).toContain('stat-hud-focus')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows what a picked piece would change', () => {
    render(<StatHud variant="strip" sheet={sheet()} preview={{ ...gear, shellHardness: 9 }} />)
    expect(screen.getByTestId('stat-hud-shellHardness')).toHaveTextContent('+5')
    expect(screen.getByTestId('stat-hud-shellHardness').querySelector('[data-kind="up"]')).not.toBeNull()
  })

  it('keeps a small bonus visible on the bar', () => {
    render(<StatHud variant="strip" sheet={sheet()} />)
    expect(screen.getByTestId('stat-hud-pincerTorque').querySelector('[data-kind="gear"]')).not.toBeNull()
  })

  it('gives phone players codes with full names one tap away', () => {
    render(<StatHud variant="rail" sheet={sheet()} />)
    const shell = screen.getByTestId('stat-hud-shellHardness')
    expect(shell).toHaveTextContent('SHL')
    expect(shell).toHaveAccessibleName(/^Shell 61: Holding your boundaries/)
  })
})
