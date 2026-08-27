import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HUDHeader } from './HUDHeader'
import { authClient } from '@/lib/auth-client'
import { getAssetUrl } from '@/lib/assets'

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

describe('HUDHeader Component', () => {
  it('renders current level 1 badge and next level 2 badge by default', () => {
    render(<HUDHeader />)

    expect(screen.getByLabelText('Level 1 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Next Level 2 Badge')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders custom clearance stage level 3 and next level 4 badge', () => {
    render(<HUDHeader stage={3} />)

    expect(screen.getByLabelText('Level 3 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Next Level 4 Badge')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('renders apex badge when stage 4 is achieved', () => {
    render(<HUDHeader stage={4} />)

    expect(screen.getByLabelText('Level 4 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Apex Level Badge')).toBeInTheDocument()
    expect(screen.getByText('APEX')).toBeInTheDocument()
  })

  it('renders chroma-keyed claw image facing right and does not render tail image', () => {
    render(<HUDHeader />)

    const clawImg = screen.getByRole('img', { name: 'Exoshell Claw' })
    expect(clawImg).toBeInTheDocument()
    expect(clawImg).toHaveAttribute('src', getAssetUrl('/images/crab_claw.png'))

    const tailImg = screen.queryByRole('img', { name: 'Benthic Appendage' })
    expect(tailImg).not.toBeInTheDocument()
  })
})
