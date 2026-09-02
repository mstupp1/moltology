import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { SettingsPage } from './SettingsPage'

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

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders Underwater Bubbles toggle under Preferences and toggles VFX state', async () => {
    render(
      <ToastProvider>
        <SettingsPage />
      </ToastProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Underwater Bubbles')).toBeInTheDocument()
    })

    expect(screen.getByText('Visible across the hub')).toBeInTheDocument()
    expect(screen.getByText('Email Updates')).toBeInTheDocument()
    expect(screen.getByTestId('hub-surface-controls')).toBeInTheDocument()

    const toggle = screen.getByRole('switch', { name: /toggle underwater bubbles/i })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText(/Hidden — reduces motion and battery use/i)).toBeInTheDocument()
    expect(localStorage.getItem('moltology_heavy_vfx_disabled')).toBe('true')
  })

  it('renders view-only seed number and does not render height slider', async () => {
    render(
      <ToastProvider>
        <SettingsPage />
      </ToastProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('settings-seed-number')).toBeInTheDocument()
    })

    expect(screen.getByText('Seed Number')).toBeInTheDocument()
    expect(screen.queryByText(/Chassis Height/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^short$/i })).not.toBeInTheDocument()
  })
})
