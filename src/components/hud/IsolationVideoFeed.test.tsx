import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  IsolationVideoFeed,
  ISOLATION_CAMERA_FEEDS,
} from './IsolationVideoFeed'
import type { IsolationSettings } from './IsolationSettingsModal'

const mockSettings: IsolationSettings = {
  isForceFieldEngaged: true,
  isPrivacyShellEngaged: true,
  socialNoiseSuppression: 99.4,
  anonymityStage: 2,
  submergenceFreq: 8.4,
  empathyDampening: 10,
  showScanlines: false,
  showTelemetryOSD: false,
  visionFilter: 'standard',
  autoCycleFeeds: true,
}

describe('IsolationVideoFeed Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders clean video feed with minimal top-left name overlay and playback controls', () => {
    render(
      <IsolationVideoFeed
        settings={mockSettings}
        onOpenSettings={vi.fn()}
      />
    )

    expect(screen.getByText('ISOLATION PROTOCOLS')).toBeInTheDocument()
    expect(screen.getByText(/CYBER-BENTHIC ASCENSION/i)).toBeInTheDocument()
    expect(screen.getByText(/FEED 1 \//i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pause feed/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next video/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous video/i })).toBeInTheDocument()
  })

  it('allows navigating to next and previous videos', () => {
    render(
      <IsolationVideoFeed
        settings={mockSettings}
        onOpenSettings={vi.fn()}
      />
    )

    // Click Next Video
    const nextBtn = screen.getByRole('button', { name: /next video/i })
    fireEvent.click(nextBtn)

    expect(screen.getByText(/ASSET TRANSMUTATION/i)).toBeInTheDocument()
    expect(screen.getByText(/FEED 2 \//i)).toBeInTheDocument()

    // Click Previous Video
    const prevBtn = screen.getByRole('button', { name: /previous video/i })
    fireEvent.click(prevBtn)

    expect(screen.getByText(/CYBER-BENTHIC ASCENSION/i)).toBeInTheDocument()
    expect(screen.getByText(/FEED 1 \//i)).toBeInTheDocument()
  })

  it('triggers onOpenSettings when Settings button is clicked in video controls', () => {
    const onOpenSettings = vi.fn()
    render(
      <IsolationVideoFeed
        settings={mockSettings}
        onOpenSettings={onOpenSettings}
      />
    )

    const settingsBtn = screen.getByRole('button', { name: /open protocol settings/i })
    fireEvent.click(settingsBtn)

    expect(onOpenSettings).toHaveBeenCalledTimes(1)
  })

  it('contains volume, speed, fullscreen, and PiP controls', () => {
    render(
      <IsolationVideoFeed
        settings={mockSettings}
        onOpenSettings={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /unmute stream/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /playback rate/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enter fullscreen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /picture in picture mode/i })).toBeInTheDocument()
  })
})
