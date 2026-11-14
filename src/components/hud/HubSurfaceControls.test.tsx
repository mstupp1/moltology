import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HubSurfaceControls } from './HubSurfaceControls'
import { ToastProvider } from '@/components/ui/ToastProvider'

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

  it('renders device notification and install rows', () => {
    render(<ToastProvider><HubSurfaceControls /></ToastProvider>)
    expect(screen.getByText('Device notifications')).toBeInTheDocument()
    expect(screen.getByText('Install the app')).toBeInTheDocument()
  })

  it('requests system permission when arming surface alerts', async () => {
    render(<ToastProvider><HubSurfaceControls /></ToastProvider>)
    fireEvent.click(screen.getByRole('switch', { name: 'Toggle device notifications' }))
    await waitFor(() => {
      expect(enable).toHaveBeenCalled()
    })
  })

  it('triggers install prompt', async () => {
    render(<ToastProvider><HubSurfaceControls /></ToastProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Install' }))
    await waitFor(() => {
      expect(install).toHaveBeenCalled()
    })
  })
})
