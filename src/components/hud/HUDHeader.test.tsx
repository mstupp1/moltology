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
  it('renders current stage 1 badge and next stage 2 badge by default', () => {
    render(<HUDHeader />)

    expect(screen.getByLabelText('Stage 1 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Next Stage 2 Badge')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders custom clearance stage level 3 and next level 4 badge', () => {
    render(<HUDHeader stage={3} />)

    expect(screen.getByLabelText('Stage 3 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Next Stage 4 Badge')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('renders apex badge when stage 4 is achieved', () => {
    render(<HUDHeader stage={4} />)

    expect(screen.getByLabelText('Stage 4 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Apex Stage Badge')).toBeInTheDocument()
    expect(screen.getByText('APEX')).toBeInTheDocument()
  })

  it('renders Stage 2 to Stage 3 clearance badges without sub-stage code when xp is passed', () => {
    const { container } = render(<HUDHeader xp={2500} />)

    // 2500 XP is Stage 2 (The Soft-Shed), progressing toward Stage 3
    expect(screen.getByLabelText('Stage 2 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Next Stage 3 Badge')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    // Sub-stage code S-1 should NOT appear in the progress bar
    expect(screen.queryByText('S-1')).not.toBeInTheDocument()

    // 500 / 8,000 XP in Stage 2 = 6%
    expect(container.querySelector('[aria-label="Progression: 6% from Stage 2 to Stage 3"]')).toBeInTheDocument()
  })
})
