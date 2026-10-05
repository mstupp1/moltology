import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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

  it('renders the live preview with both the full body and the portrait inset', () => {
    render(
      <CharacterCreationStep
        initialSeed="larva-motion-seed"
        onBack={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    expect(screen.getByTestId('avatar-creator-preview')).toBeInTheDocument()
    expect(screen.getByTestId('lobster-avatar-full-body')).toBeInTheDocument()
    expect(screen.getAllByTestId('lobster-avatar-portrait').length).toBeGreaterThan(0)
    expect(screen.getByTestId('avatar-creator-panel')).toBeInTheDocument()
    expect(screen.queryByText('Seed Number')).not.toBeInTheDocument()
  })

  it('switches race and shows the matching race as selected', () => {
    render(
      <CharacterCreationStep
        initialSeed="larva-race-seed"
        onBack={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    const raceGroup = screen.getByRole('group', { name: 'Race' })
    const crab = within(raceGroup).getByRole('button', { name: /Crab/i })
    expect(crab).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(crab)
    expect(crab).toHaveAttribute('aria-pressed', 'true')
    expect(within(raceGroup).getByRole('button', { name: /Lobster/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps the chosen race when surprising the member with a new look', () => {
    render(
      <CharacterCreationStep
        initialConfig={{ style: 'critters', seed: 'larva-surprise', race: 'crab' }}
        onBack={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Surprise me/i }))
    const raceGroup = screen.getByRole('group', { name: 'Race' })
    expect(within(raceGroup).getByRole('button', { name: /Crab/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('labels the head shape picker as a shell shape for crabs', () => {
    render(
      <CharacterCreationStep
        initialConfig={{ style: 'critters', seed: 'larva-shape', race: 'lobster' }}
        onBack={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    expect(screen.getByText('Head shape')).toBeInTheDocument()
    const raceGroup = screen.getByRole('group', { name: 'Race' })
    fireEvent.click(within(raceGroup).getByRole('button', { name: /Crab/i }))
    expect(screen.getByText('Shell shape')).toBeInTheDocument()
    const heart = screen.getByRole('button', { name: /Heart/i })
    fireEvent.click(heart)
    expect(heart).toHaveAttribute('aria-pressed', 'true')
  })
})
