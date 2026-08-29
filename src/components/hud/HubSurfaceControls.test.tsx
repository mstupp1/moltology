import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HubSurfaceControls } from './HubSurfaceControls'

vi.mock('sonner', () => ({
  toast: {
    message: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const install = vi.fn().mockResolvedValue('unavailable')
const enable = vi.fn().mockResolvedValue('granted')
const disable = vi.fn()

vi.mock('@/hooks/usePwaInstall', () => ({
  usePwaInstall: () => ({
    isStandalone: false,
    canPromptInstall: true,
    showInstallBanner: false,
    dismissBanner: vi.fn(),
    install,
  }),
}))

vi.mock('@/hooks/useSystemNotifications', () => ({
  useSystemNotifications: () => ({
    supported: true,
    enabled: false,
    permission: 'default',
    enable,
    disable,
    refresh: vi.fn(),
  }),
}))

describe('HubSurfaceControls', () => {
  beforeEach(() => {
    install.mockClear()
    enable.mockClear()
    disable.mockClear()
  })

  it('renders surface alert and install controls', () => {
    render(<HubSurfaceControls />)
    expect(screen.getByText('Surface Alerts')).toBeInTheDocument()
    expect(screen.getByText('Install Command Hub')).toBeInTheDocument()
  })

  it('requests system permission when arming surface alerts', async () => {
    render(<HubSurfaceControls />)
    fireEvent.click(screen.getByRole('switch', { name: 'Toggle surface alerts' }))
    await waitFor(() => {
      expect(enable).toHaveBeenCalled()
    })
  })

  it('triggers install prompt', async () => {
    render(<HubSurfaceControls />)
    fireEvent.click(screen.getByRole('button', { name: 'Install' }))
    await waitFor(() => {
      expect(install).toHaveBeenCalled()
    })
  })
})
