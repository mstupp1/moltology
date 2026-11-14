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
  getOracleChatSettingsFn: vi.fn().mockResolvedValue({ personality: 'balanced', customInstructions: '', autoPick: true }),
  saveOracleChatSettingsFn: vi.fn(),
  setOracleSkillSettingsFn: vi.fn(),
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

  it('groups settings into titled cards without the old effects toggle', async () => {
    render(
      <ToastProvider>
        <SettingsPage />
      </ToastProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Account', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Notifications', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Help', level: 2 })).toBeInTheDocument()
    expect(screen.queryByTestId('premium-settings')).not.toBeInTheDocument()
    expect(screen.getByText('Email updates')).toBeInTheDocument()
    expect(screen.getByText('Sign-in methods')).toBeInTheDocument()
    expect(screen.getByTestId('hub-surface-controls')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Replay' })).toBeInTheDocument()
    expect(screen.queryByText(/visual effects/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Preferences')).not.toBeInTheDocument()
    expect(screen.queryByText('Command Surface')).not.toBeInTheDocument()
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

  it('shows the simplified settings title without the avatar section', async () => {
    render(<ToastProvider><SettingsPage /></ToastProvider>)
    expect(await screen.findByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Plan & usage' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Avatar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Open character studio' })).not.toBeInTheDocument()
    expect(screen.queryByText('Manage your account, email preferences, sign-in methods, and display options.')).not.toBeInTheDocument()
    expect(screen.queryByTestId('avatar-creator-panel')).not.toBeInTheDocument()
  })
})
