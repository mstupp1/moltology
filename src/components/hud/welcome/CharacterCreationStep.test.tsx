import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CharacterCreationStep } from './CharacterCreationStep'

describe('CharacterCreationStep', () => {
  it('renders view-only seed number and does not render height slider', () => {
    const onBack = vi.fn()
    const onComplete = vi.fn()
    render(
      <CharacterCreationStep
        initialSeed="larva-test-123"
        onBack={onBack}
        onComplete={onComplete}
      />,
    )

    // Should render Seed Number view-only section
    expect(screen.getByText('Seed Number')).toBeInTheDocument()
    expect(screen.queryByText('VIEW ONLY')).not.toBeInTheDocument()
    const seedEl = screen.getByTestId('seed-number')
    expect(seedEl).toBeInTheDocument()
    expect(seedEl.textContent).toBe('larva-test-123')

    // Should NOT render height slider / options
    expect(screen.queryByText(/Chassis Height/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^short$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^regular$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^tall$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^towering$/i })).not.toBeInTheDocument()
  })

  it('updates the view-only seed number when clicking Randomize', () => {
    const onBack = vi.fn()
    const onComplete = vi.fn()
    render(
      <CharacterCreationStep
        initialSeed="larva-fixed-seed"
        onBack={onBack}
        onComplete={onComplete}
      />,
    )

    const seedEl = screen.getByTestId('seed-number')
    expect(seedEl.textContent).toBe('larva-fixed-seed')

    const randomizeBtn = screen.getByRole('button', { name: /Randomize/i })
    fireEvent.click(randomizeBtn)

    // Seed should have changed from initial
    expect(seedEl.textContent).not.toBe('larva-fixed-seed')
    expect(seedEl.textContent).toMatch(/^larva-/)
  })
})
