import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ResumeOracleConsultation } from './ResumeOracleConsultation'
import { authClient } from '@/lib/auth-client'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/components/hud/OracleContext', () => ({
  useSafeOracle: vi.fn(() => undefined),
}))

vi.mock('@/lib/server/api', () => ({
  getAIThreadsFn: vi.fn().mockResolvedValue([]),
}))

describe('ResumeOracleConsultation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
  })

  it('hides the control for guests', () => {
    render(<ResumeOracleConsultation />)
    expect(screen.queryByTestId('resume-oracle-consultation')).not.toBeInTheDocument()
  })

  it('hides the control while the session is unresolved', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: true } as any)
    render(<ResumeOracleConsultation />)
    expect(screen.queryByTestId('resume-oracle-consultation')).not.toBeInTheDocument()
  })

  it('hides the control when a member has no open consultations', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'usr_member', name: 'Initiate' } },
      isPending: false,
    } as any)
    const { getAIThreadsFn } = await import('@/lib/server/api')
    vi.mocked(getAIThreadsFn).mockResolvedValue([])

    render(<ResumeOracleConsultation />)

    await waitFor(() => {
      expect(getAIThreadsFn).toHaveBeenCalled()
    })
    expect(screen.queryByTestId('resume-oracle-consultation')).not.toBeInTheDocument()
  })

  it('opens Oracle on the last updated thread, not a blank consultation', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'usr_member', name: 'Initiate' } },
      isPending: false,
    } as any)
    const { getAIThreadsFn } = await import('@/lib/server/api')
    vi.mocked(getAIThreadsFn).mockResolvedValue([
      {
        id: 'thread-old',
        title: 'First inquiry',
        updatedAt: '2026-08-20T12:00:00.000Z',
      },
      {
        id: 'thread-latest',
        title: 'Carcinization Inquiries',
        updatedAt: '2026-08-30T16:00:00.000Z',
      },
    ] as any)

    render(<ResumeOracleConsultation />)

    const button = await screen.findByRole('button', { name: /Continue last Oracle consultation/i })
    expect(screen.getByText(/Carcinization Inquiries/i)).toBeInTheDocument()
    expect(screen.queryByText(/Resume chat/i)).not.toBeInTheDocument()

    fireEvent.click(button)

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/oracle',
      search: { thread: 'thread-latest' },
    })
  })

  it('uses already-loaded Oracle threads and does not invent a second fetch', async () => {
    const { useSafeOracle } = await import('@/components/hud/OracleContext')
    const { getAIThreadsFn } = await import('@/lib/server/api')
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'usr_member', name: 'Initiate' } },
      isPending: false,
    } as any)
    vi.mocked(useSafeOracle).mockReturnValue({
      threads: [
        { id: 'thread-ctx', title: 'Held line from the deep', updatedAt: '2026-08-30T12:00:00.000Z' },
      ],
      isLoadingThreads: false,
    } as any)

    render(<ResumeOracleConsultation />)

    expect(await screen.findByText(/Held line from the deep/i)).toBeInTheDocument()
    expect(getAIThreadsFn).not.toHaveBeenCalled()
  })
})
