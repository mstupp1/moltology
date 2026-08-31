import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WelcomeSplash } from './WelcomeSplash'
import { ToastProvider } from '@/components/ui/ToastProvider'

// Mock auth client
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn().mockReturnValue({
      data: {
        user: {
          id: 'test-user-123',
          name: 'Initiate 42',
          email: 'initiate42@moltology.org',
        },
      },
      isPending: false,
    }),
  },
}))

// Mock server API functions
const mockSaveLobsterAvatar = vi.fn().mockResolvedValue({ success: true })
const mockUpdateUserStats = vi.fn().mockResolvedValue({ success: true })
const mockClaimHandle = vi.fn().mockResolvedValue({ handle: 'claw_lord', displayName: 'claw_lord' })

vi.mock('@/lib/server/api', () => ({
  saveLobsterAvatarFn: (...args: any[]) => mockSaveLobsterAvatar(...args),
  updateUserStatsFn: (...args: any[]) => mockUpdateUserStats(...args),
  claimMemberHandleFn: (...args: any[]) => mockClaimHandle(...args),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt-token'),
}))

describe('WelcomeSplash Flow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders Step 1 (Initial Transmission) by default', () => {
    const onDismiss = vi.fn()
    render(<ToastProvider><WelcomeSplash userName="Initiate 42" onDismiss={onDismiss} /></ToastProvider>)

    // Check step 1 banner and title
    expect(screen.getByText(/01 · TRANSMISSION/i)).toBeInTheDocument()
    expect(screen.getByText(/WELCOME, INITIATE/i)).toBeInTheDocument()
    expect(screen.getByText(/The Larval Condition/i)).toBeInTheDocument()
    expect(screen.getByText(/Moltology Transmission #001/i)).toBeInTheDocument()

    // Check proceed button
    expect(screen.getByText(/Proceed to Carapace Registration/i)).toBeInTheDocument()
  })

  it('advances to Step 2 (Character Creation) when clicking proceed button', () => {
    const onDismiss = vi.fn()
    render(<ToastProvider><WelcomeSplash userName="Initiate 42" onDismiss={onDismiss} /></ToastProvider>)

    const proceedBtn = screen.getByText(/Proceed to Carapace Registration/i)
    fireEvent.click(proceedBtn)

    // Verify Step 2 is now mounted
    expect(screen.getByText(/CALIBRATE LARVAL CHASSIS/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Randomize/i })).toBeInTheDocument()
    expect(screen.getByText(/Base Biometrics Roller/i)).toBeInTheDocument()
    expect(screen.getByText(/300 \/ 300 PTS/i)).toBeInTheDocument()
  })

  it('advances to Step 2 when clicking skip transmission', () => {
    const onDismiss = vi.fn()
    render(<ToastProvider><WelcomeSplash userName="Initiate 42" onDismiss={onDismiss} /></ToastProvider>)

    const skipBtn = screen.getByText(/Skip Transmission/i)
    fireEvent.click(skipBtn)

    expect(screen.getByText(/CALIBRATE LARVAL CHASSIS/i)).toBeInTheDocument()
  })

  it('allows switching between steps via the top navigation pills', () => {
    const onDismiss = vi.fn()
    render(<ToastProvider><WelcomeSplash userName="Initiate 42" onDismiss={onDismiss} /></ToastProvider>)

    // Click Step 2 pill
    const step2Pill = screen.getByRole('button', { name: /02 · CARAPACE & STATS/i })
    fireEvent.click(step2Pill)
    expect(screen.getByText(/CALIBRATE LARVAL CHASSIS/i)).toBeInTheDocument()

    // Click Step 1 pill
    const step1Pill = screen.getByRole('button', { name: /01 · TRANSMISSION/i })
    fireEvent.click(step1Pill)
    expect(screen.getByText(/The Larval Condition/i)).toBeInTheDocument()
  })

  it('allows re-rolling base stats and maintaining fixed total sum', async () => {
    const onDismiss = vi.fn()
    render(<ToastProvider><WelcomeSplash userName="Initiate 42" onDismiss={onDismiss} initialStep={2} /></ToastProvider>)

    expect(screen.getByText(/Base Biometrics Roller/i)).toBeInTheDocument()
    const rollStatsBtn = screen.getByRole('button', { name: /Roll Base Stats/i })

    fireEvent.click(rollStatsBtn)

    // Wait for the roll animation to settle
    await waitFor(
      () => {
        expect(screen.getByText(/300 \/ 300 PTS/i)).toBeInTheDocument()
      },
      { timeout: 1500 }
    )
  })

  it('completes the welcome flow, persists avatar and stats, and calls onDismiss', async () => {
    const onDismiss = vi.fn()
    render(<ToastProvider><WelcomeSplash userName="Initiate 42" onDismiss={onDismiss} initialStep={2} /></ToastProvider>)

    fireEvent.change(screen.getByPlaceholderText('your_designation'), { target: { value: 'claw_lord' } })
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Enter Synaptic Core/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockClaimHandle).toHaveBeenCalledWith({
        data: expect.objectContaining({ handle: 'claw_lord', userId: 'test-user-123' }),
      })
      expect(mockSaveLobsterAvatar).toHaveBeenCalled()
      expect(mockUpdateUserStats).toHaveBeenCalled()
      expect(localStorage.getItem('moltology:welcomed:test-user-123')).toBe('1')
    })
  })
})
