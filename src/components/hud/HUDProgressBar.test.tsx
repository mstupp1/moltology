import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HUDProgressBar } from './HUDProgressBar'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/dashboard' }),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
    signOut: vi.fn(),
  },
}))

describe('HUDProgressBar Component', () => {
  it('renders current stage 1 badge and next stage 2 badge by default', () => {
    render(<HUDProgressBar />)

    expect(screen.getByLabelText('Stage 1 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Next Stage 2 Badge')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders custom stage level 3 and next stage 4 badge', () => {
    render(<HUDProgressBar stage={3} />)

    expect(screen.getByLabelText('Stage 3 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Next Stage 4 Badge')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('renders apex badge when stage 4 is achieved', () => {
    render(<HUDProgressBar stage={4} />)

    expect(screen.getByLabelText('Stage 4 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Apex Stage Badge')).toBeInTheDocument()
    expect(screen.getByText('APEX')).toBeInTheDocument()
  })

  it('conditionally hides task bar when showTaskBar is false', () => {
    const { container } = render(<HUDProgressBar showTaskBar={false} />)
    expect(container.querySelector('[aria-label="Daily alignment tasks schedule"]')).not.toBeInTheDocument()
  })

  it('conditionally hides task bar when legacy showClock is false', () => {
    const { container } = render(<HUDProgressBar showClock={false} />)
    expect(container.querySelector('[aria-label="Daily alignment tasks schedule"]')).not.toBeInTheDocument()
  })

  it('renders stage 1 to stage 2 progression without sub-stage codes when xp is passed', () => {
    const { container } = render(<HUDProgressBar xp={1500} />)

    expect(screen.getByLabelText('Stage 1 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Next Stage 2 Badge')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    // Sub-stage codes like L-1 or L-3 should NOT be displayed in the macro progress bar
    expect(screen.queryByText('L-1')).not.toBeInTheDocument()
    expect(screen.queryByText('L-3')).not.toBeInTheDocument()

    // Accessible progression label verifies correct proportional fill
    expect(container.querySelector('[aria-label="Progression: 75% from Stage 1 to Stage 2"]')).toBeInTheDocument()
  })

  it('keeps bar 100% full at Stage 4 Apex without sub-stage codes', () => {
    const { container } = render(<HUDProgressBar xp={50000} />)

    expect(screen.getByLabelText('Stage 4 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Apex Stage Badge')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('APEX')).toBeInTheDocument()

    // Sub-stage code C-1 should NOT be displayed
    expect(screen.queryByText('C-1')).not.toBeInTheDocument()

    // 100% full progress ratio
    expect(container.querySelector('[aria-label="Progression: Stage 4 Apex (100%)"]')).toBeInTheDocument()
  })
})
