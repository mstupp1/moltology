import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MoltMaxPage } from './MoltMaxPage'
import { authClient } from '@/lib/auth-client'
import { ToastProvider } from '@/components/ui/ToastProvider'

const mockNavigate = vi.fn()
const mockUpdateUserStats = vi.hoisted(() => vi.fn().mockResolvedValue({}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/moltmax' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null })),
    signOut: vi.fn(),
  },
}))

vi.mock('@/lib/server/api', () => ({
  updateUserStatsFn: mockUpdateUserStats,
  getUserProfileFn: vi.fn(),
}))

const renderPage = () => render(<ToastProvider><MoltMaxPage /></ToastProvider>)

const answerCurrentQuestion = () => {
  const choices = screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-pressed'))
  fireEvent.click(choices[0])
  fireEvent.click(screen.getByRole('button', { name: /next question|enter next chamber|reveal my clearance/i }))
}

describe('MoltMaxPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockUpdateUserStats.mockClear()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
  })

  it('renders a commanding audit hero and five-vector promise', () => {
    renderPage()
    expect(screen.getByText(/Measure the shell/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /initiate biometric audit/i })).toBeInTheDocument()
    expect(screen.getByText(/Carapace Resilience/i)).toBeInTheDocument()
    expect(screen.getByText(/Depth Composure/i)).toBeInTheDocument()
  })

  it('moves through the fifteen-question chamber flow and reveals a clearance', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /initiate biometric audit/i }))
    expect(screen.getByText(/sudden wave of criticism/i)).toBeInTheDocument()
    expect(screen.getByText('01 / 15')).toBeInTheDocument()

    for (let question = 0; question < 15; question += 1) answerCurrentQuestion()

    expect(screen.getByRole('heading', { name: /your shell has spoken/i })).toBeInTheDocument()
    expect(screen.getByText(/Moltmax (score|index)/i)).toBeInTheDocument()
    expect(screen.getByText(/Five-(trait|vector) profile/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export png/i })).toBeInTheDocument()
  })

  it('supports back navigation before leaving the current audit', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /initiate biometric audit/i }))
    answerCurrentQuestion()
    expect(screen.getByText(/when a clear decision/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^back$/i }))
    expect(screen.getByText(/sudden wave of criticism/i)).toBeInTheDocument()
  })

  it('navigates to the canonical guide', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /read the canonical moltmaxxing guide/i }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/moltmaxxing' })
  })

  it('persists the complete clearance payload for an authenticated user', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: { user: { id: 'user-1' } } } as any)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /initiate biometric audit/i }))
    for (let question = 0; question < 15; question += 1) answerCurrentQuestion()

    fireEvent.click(screen.getByRole('button', { name: /save (to profile|signal to core)/i }))

    await waitFor(() => expect(mockUpdateUserStats).toHaveBeenCalledWith({
      data: expect.objectContaining({
        moltmaxScore: expect.any(Number),
        moltmaxClearance: expect.stringMatching(/^[A-Z]-[1-3]$/),
        moltmaxStage: expect.stringContaining('STAGE'),
        moltmaxDimensionScores: expect.objectContaining({ shellHardness: expect.any(Number) }),
      }),
    }))
  })
})
