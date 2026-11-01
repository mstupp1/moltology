import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { SettingsPage } from './SettingsPage'
import { updateEmailPreferencesFn } from '@/lib/server/api'

vi.mock('@tanstack/react-router', () => ({ Link: ({to,children,...props}:any) => <a href={to} {...props}>{children}</a> }))

vi.mock('@/hooks/useAuthSession', () => ({
  useAuthSession: () => ({
    user: { id: 'user-1', email: 'operative@moltology.org', name: 'Operative' },
    userId: 'user-1',
    isPending: false,
  }),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt'),
}))

vi.mock('@/lib/server/premium-api', () => ({
  getPremiumMembershipFn: vi.fn().mockResolvedValue({ hasPurchasedPremium: false, isPremium: false }),
  setPremiumAccessFn: vi.fn(),
}))

vi.mock('@/lib/server/api', () => ({
  getUserProfileFn: vi.fn().mockResolvedValue({
    emailOptIn: false,
    handle: 'operative',
    avatarConfig: null,
  }),
  updateEmailPreferencesFn: vi.fn().mockResolvedValue({}),
  claimMemberHandleFn: vi.fn().mockResolvedValue({ handle: 'operative' }),
  saveLobsterAvatarFn: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/components/hud/HubSurfaceControls', () => ({
  HubSurfaceControls: () => <div data-testid="hub-surface-controls" />,
}))

vi.mock('@/components/hud/LobsterAvatarPortrait', () => ({
  LobsterAvatarPortrait: () => <div data-testid="lobster-avatar-portrait" />,
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    listAccounts: vi.fn().mockResolvedValue({
      data: [{ id: 'acc-email', providerId: 'credential' }],
      error: null,
    }),
    linkSocial: vi.fn(),
    unlinkAccount: vi.fn(),
  },
}))

vi.mock('@/lib/auth-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth-config')>()
  return {
    ...actual,
    isGoogleAuthEnabled: () => true,
  }
})

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the shared heavy effects toggle and persists the VFX preference', async () => {
    render(
      <ToastProvider>
        <SettingsPage />
      </ToastProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Heavy visual effects')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('premium-settings')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Purchase Premium/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancel Premium/i })).not.toBeInTheDocument()
    expect(screen.getByText('Underwater bubbles and animated ritual flames enabled.')).toBeInTheDocument()
    expect(screen.getByText('Email Updates')).toBeInTheDocument()
    expect(screen.getByText('Sign-in methods')).toBeInTheDocument()
    expect(screen.getByTestId('hub-surface-controls')).toBeInTheDocument()

    const toggle = screen.getByRole('switch', { name: /toggle heavy visual effects/i })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText(/Bubbles and animated ritual flames off/i)).toBeInTheDocument()
    expect(localStorage.getItem('moltology_heavy_vfx_disabled')).toBe('true')
  })

  it('keeps an unconfirmed subscription off and asks the member to check email', async () => {
    vi.mocked(updateEmailPreferencesFn).mockResolvedValueOnce({ success: true, emailOptIn: false, confirmationPending: true })
    render(<ToastProvider><SettingsPage /></ToastProvider>)
    const toggle = await screen.findByRole('switch', { name: /toggle email updates/i })
    fireEvent.click(toggle)
    expect(await screen.findByText('Check your email to confirm your subscription.')).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('restores the previous preference and reports a failed update', async () => {
    vi.mocked(updateEmailPreferencesFn).mockRejectedValueOnce(new Error('offline'))
    render(<ToastProvider><SettingsPage /></ToastProvider>)
    const toggle = await screen.findByRole('switch', { name: /toggle email updates/i })
    fireEvent.click(toggle)
    expect(await screen.findByText('Could not update email preferences. Please try again.')).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('links to the unified character studio instead of a second editor', async () => {
    render(<ToastProvider><SettingsPage /></ToastProvider>)
    expect(await screen.findByRole('link', {name:'Open character studio'})).toHaveAttribute('href','/chassis')
    expect(screen.queryByTestId('avatar-creator-panel')).not.toBeInTheDocument()
  })
})
