import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  IsolationSettingsModal,
  type IsolationSettings,
} from './IsolationSettingsModal'

const mockSettings: IsolationSettings = {
  isForceFieldEngaged: true,
  isPrivacyShellEngaged: true,
  socialNoiseSuppression: 99.4,
  anonymityStage: 2,
  submergenceFreq: 8.4,
  empathyDampening: 10,
  showScanlines: true,
  showTelemetryOSD: true,
  visionFilter: 'standard',
  autoCycleFeeds: true,
}

describe('IsolationSettingsModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <IsolationSettingsModal
        isOpen={false}
        onClose={vi.fn()}
        settings={mockSettings}
        onUpdateSettings={vi.fn()}
        onForcePrivate={vi.fn()}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders modal with force-field, privacy shell, and calibration sliders when isOpen is true', () => {
    render(
      <IsolationSettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={mockSettings}
        onUpdateSettings={vi.fn()}
        onForcePrivate={vi.fn()}
      />
    )

    expect(screen.getByText(/ISOLATION FORCE-FIELD/i)).toBeInTheDocument()
    expect(screen.getByText(/MOLT PRIVACY SHELL/i)).toBeInTheDocument()
    expect(screen.getByText(/SIGNAL CALIBRATION CONTROLS/i)).toBeInTheDocument()
    expect(screen.getByText(/SURVEILLANCE OPTICS & HUD/i)).toBeInTheDocument()
    expect(screen.getByText(/94%/i)).toBeInTheDocument()
  })

  it('calls onUpdateSettings when toggling force-field or privacy shell', () => {
    const onUpdateSettings = vi.fn()
    render(
      <IsolationSettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={mockSettings}
        onUpdateSettings={onUpdateSettings}
        onForcePrivate={vi.fn()}
      />
    )

    const disengageBtn = screen.getByRole('button', { name: /disengage force-field/i })
    fireEvent.click(disengageBtn)

    expect(onUpdateSettings).toHaveBeenCalledWith({ isForceFieldEngaged: false })

    const toggleShellBtn = screen.getByRole('button', { name: /toggle molt privacy shell/i })
    fireEvent.click(toggleShellBtn)

    expect(onUpdateSettings).toHaveBeenCalledWith({ isPrivacyShellEngaged: false })
  })

  it('calls onForcePrivate when FORCE PRIVATE button is clicked', () => {
    const onForcePrivate = vi.fn()
    render(
      <IsolationSettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={mockSettings}
        onUpdateSettings={vi.fn()}
        onForcePrivate={onForcePrivate}
      />
    )

    const forceBtn = screen.getByRole('button', { name: /force private/i })
    fireEvent.click(forceBtn)

    expect(onForcePrivate).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when close button or apply button is clicked', () => {
    const onClose = vi.fn()
    render(
      <IsolationSettingsModal
        isOpen={true}
        onClose={onClose}
        settings={mockSettings}
        onUpdateSettings={vi.fn()}
        onForcePrivate={vi.fn()}
      />
    )

    const closeBtn = screen.getByRole('button', { name: /close protocol settings/i })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)

    const applyBtn = screen.getByRole('button', { name: /apply & close protocols/i })
    fireEvent.click(applyBtn)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
