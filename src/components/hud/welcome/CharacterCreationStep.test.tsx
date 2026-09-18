import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CharacterCreationStep } from './CharacterCreationStep'
import { resetLobsterFullBodyMotionForTests } from '@/lib/lobster-avatar-slots'

function mockMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('CharacterCreationStep', () => {
  beforeEach(() => {
    resetLobsterFullBodyMotionForTests()
    mockMatchMedia()
  })

  afterEach(() => {
    resetLobsterFullBodyMotionForTests()
  })

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

  it('renders circular animated portrait preview and does not mount square full-body', () => {
    render(
      <CharacterCreationStep
        initialSeed="larva-motion-seed"
        onBack={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    expect(screen.getByTestId('lobster-avatar-portrait')).toBeInTheDocument()
    expect(screen.queryByTestId('lobster-avatar-full-body')).toBeNull()
    expect(screen.getByTestId('lobster-avatar-inline-svg')).toBeInTheDocument()
  })
})
