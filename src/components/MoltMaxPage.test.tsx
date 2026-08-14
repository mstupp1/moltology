import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MoltMaxPage } from './MoltMaxPage'
import { authClient } from '@/lib/auth-client'
import { ToastProvider } from '@/components/ui/ToastProvider'

const mockNavigate = vi.fn()

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

describe('MoltMaxPage Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
  })

  it('renders header, biometric sliders and initial score calculation', () => {
    render(
      <ToastProvider>
        <MoltMaxPage />
      </ToastProvider>
    )

    expect(screen.getByText(/THE OFFICIAL/i)).toBeInTheDocument()
    expect(screen.getByText('MOLTMAXXING')).toBeInTheDocument()
    expect(screen.getByText(/BIOMETRIC TELEMETRY INPUTS/i)).toBeInTheDocument()
    expect(screen.getByText(/SHELL HARDNESS DENSITY/i)).toBeInTheDocument()
    expect(screen.getByText(/PINCER TORQUE DYNAMOMETRY/i)).toBeInTheDocument()
    expect(screen.getByText(/ASSIGNED ARCHETYPE/i)).toBeInTheDocument()
    expect(screen.getByText(/POST SCORE TO X/i)).toBeInTheDocument()
    expect(screen.getByText(/EXPORT PNG/i)).toBeInTheDocument()
  })

  it('updates Moltmax calculation when sliders change', () => {
    render(
      <ToastProvider>
        <MoltMaxPage />
      </ToastProvider>
    )

    const sliders = screen.getAllByRole('slider')
    expect(sliders.length).toBe(5)

    // Adjust Shell Hardness (Slider 0) to maximum
    fireEvent.change(sliders[0], { target: { value: '100' } })
    // Adjust Pincer Torque (Slider 1) to maximum
    fireEvent.change(sliders[1], { target: { value: '100' } })

    expect(screen.getByText('100 HP')).toBeInTheDocument()
    expect(screen.getByText('100 Nm')).toBeInTheDocument()
  })

  it('displays Melt Drift warning when shell hardness is below 35 HP', () => {
    render(
      <ToastProvider>
        <MoltMaxPage />
      </ToastProvider>
    )

    const sliders = screen.getAllByRole('slider')
    // Set Shell Hardness slider to 10 HP
    fireEvent.change(sliders[0], { target: { value: '10' } })

    expect(screen.getByText(/MELT DRIFT DETECTED/i)).toBeInTheDocument()
    expect(screen.getByText(/Stop meltmaxxing/i)).toBeInTheDocument()
  })

  it('navigates to canonical guide when clicking read guide button', () => {
    render(
      <ToastProvider>
        <MoltMaxPage />
      </ToastProvider>
    )

    const guideBtn = screen.getByText('READ THE CANONICAL MOLTMAXXING GUIDE')
    fireEvent.click(guideBtn)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/moltmaxxing' })
  })
})
