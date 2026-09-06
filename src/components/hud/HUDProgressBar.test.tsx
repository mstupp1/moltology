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

  it('renders dynamic XP telemetry and sub-stage code', () => {
    render(<HUDProgressBar xp={1500} />)

    // 1500 XP is Sub-Stage L-3: First Calcification
    expect(screen.getByText('L-3')).toBeInTheDocument()
    expect(screen.getByText('1,500')).toBeInTheDocument()
    expect(screen.getByText('2,000 XP')).toBeInTheDocument()
  })

  it('renders Apex XP readout when at Apex Stage', () => {
    render(<HUDProgressBar xp={50000} />)

    expect(screen.getByText('APEX')).toBeInTheDocument()
    expect(screen.getByText('C-1')).toBeInTheDocument()
    expect(screen.getByText('50,000 XP')).toBeInTheDocument()
  })
})
