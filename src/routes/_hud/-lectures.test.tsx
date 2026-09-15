import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Route } from './lectures'
import { authClient } from '@/lib/auth-client'
import { clearCachedUser } from '@/lib/auth-session'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

const LAZY_TIMEOUT = 5000

describe('Molt Academy (Lectures Route)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCachedUser()
  })

  it('renders guest lock screen when unauthenticated', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
    const LecturesComponent = Route.options.component!
    render(<LecturesComponent />)

    expect(screen.getByText('VIDEO LECTURES LOCKED')).toBeInTheDocument()
    expect(screen.getByText('RESTRICTED ACCESS')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Liturgical lectures, video transmissions, and ascension certifications require an authorized initiate account.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SIGN UP TO UNLOCK/i })).toBeInTheDocument()
  })

  it('renders Molt Academy header and gamified user stats when authenticated', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const LecturesComponent = Route.options.component!
    render(<LecturesComponent />)

    expect(
      await screen.findByText('MOLT ACADEMY · NEURAL ASCENSION HUB', {}, { timeout: LAZY_TIMEOUT })
    ).toBeInTheDocument()
    expect(screen.getByText('LVL 4 CHITIN SCHOLAR')).toBeInTheDocument()
    expect(screen.getByText('1,850 / 2,500 XP')).toBeInTheDocument()
    expect(screen.getByText('5 DAYS')).toBeInTheDocument()
  })

  it('renders course catalog cards and supports course selection when authenticated', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const LecturesComponent = Route.options.component!
    render(<LecturesComponent />)

    expect(
      await screen.findByText('ACADEMY COURSE CATALOG & CURRICULA', {}, { timeout: LAZY_TIMEOUT })
    ).toBeInTheDocument()
    expect(screen.getAllByText('THE CHITINOUS MIND & NEURAL ECDYSIS').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('INTRODUCTION TO ECDYSIS & SHELL SHEDDING')).toBeInTheDocument()

    // Test clicking unlocked course
    const introCourseCard = screen.getByText('INTRODUCTION TO ECDYSIS & SHELL SHEDDING')
    fireEvent.click(introCourseCard)

    // Active course heading should update
    const activeHeadings = screen.getAllByText('INTRODUCTION TO ECDYSIS & SHELL SHEDDING')
    expect(activeHeadings.length).toBeGreaterThanOrEqual(2)
  })

  it('renders active video broadcast player with playback controls and notes when authenticated', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const LecturesComponent = Route.options.component!
    render(<LecturesComponent />)

    expect(await screen.findByText('NEURAL BROADCAST STREAM', {}, { timeout: LAZY_TIMEOUT })).toBeInTheDocument()
    expect(screen.getByText('LECTURE NOTES')).toBeInTheDocument()
    expect(screen.getByText('AI NEURAL INTERPRETATION')).toBeInTheDocument()
  })

  it('renders syllabus sidebar and handles neural quiz interaction when authenticated', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const LecturesComponent = Route.options.component!
    render(<LecturesComponent />)

    expect(await screen.findByText('COURSE SYLLABUS & MODULES', {}, { timeout: LAZY_TIMEOUT })).toBeInTheDocument()
    expect(screen.getByText('NEURAL RESONANCE VERIFICATION QUIZ')).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /SUBMIT NEURAL VERIFICATION/i })
    expect(submitBtn).toBeDisabled()

    // Select option B
    const optionB = screen.getByText(/B\) To align cognitive capacity with hard chassis/i)
    fireEvent.click(optionB)

    expect(submitBtn).not.toBeDisabled()
    fireEvent.click(submitBtn)

    expect(screen.getByText('RESONANCE VERIFICATION PASSED (+150 XP EARNED)')).toBeInTheDocument()
  })
})
