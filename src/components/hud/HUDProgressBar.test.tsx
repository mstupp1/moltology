import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HUDProgressBar } from './HUDProgressBar'
import { getAssetUrl } from '@/lib/assets'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/dashboard' }),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null })),
    signOut: vi.fn(),
  },
}))

describe('HUDProgressBar Component', () => {
  it('renders current level 1 badge and next level 2 badge by default', () => {
    render(<HUDProgressBar />)

    expect(screen.getByLabelText('Level 1 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Next Level 2 Badge')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders custom stage level 3 and next level 4 badge', () => {
    render(<HUDProgressBar stage={3} />)

    expect(screen.getByLabelText('Level 3 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Next Level 4 Badge')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('renders apex badge when stage 4 is achieved', () => {
    render(<HUDProgressBar stage={4} />)

    expect(screen.getByLabelText('Level 4 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Apex Level Badge')).toBeInTheDocument()
    expect(screen.getByText('APEX')).toBeInTheDocument()
  })

  it('renders crab claw indicator image with correct asset path', () => {
    render(<HUDProgressBar />)

    const clawImg = screen.getByRole('img', { name: 'Exoshell Claw' })
    expect(clawImg).toBeInTheDocument()
    expect(clawImg).toHaveAttribute('src', getAssetUrl('/images/crab_claw.png'))
  })

  it('conditionally hides task bar when showTaskBar is false', () => {
    const { container } = render(<HUDProgressBar showTaskBar={false} />)
    expect(container.querySelector('[aria-label="Daily alignment tasks schedule"]')).not.toBeInTheDocument()
  })

  it('conditionally hides task bar when legacy showClock is false', () => {
    const { container } = render(<HUDProgressBar showClock={false} />)
    expect(container.querySelector('[aria-label="Daily alignment tasks schedule"]')).not.toBeInTheDocument()
  })
})
