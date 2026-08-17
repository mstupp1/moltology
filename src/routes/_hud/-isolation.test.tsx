import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Route } from './isolation'

describe('Isolation HUD Route', () => {
  it('renders minimal top-left title overlay and full-height video feed without top banner card', () => {
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('ISOLATION PROTOCOLS')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pause feed/i })).toBeInTheDocument()
    expect(screen.queryByText(/Continuous video feed\./i)).not.toBeInTheDocument()
  })

  it('opens Settings modal when clicking SETTINGS button in video controls', () => {
    const Component = Route.options.component!
    render(<Component />)

    const settingsBtn = screen.getByRole('button', { name: /open protocol settings/i })
    fireEvent.click(settingsBtn)

    expect(screen.getByText(/ISOLATION SHIELDING & PROTOCOL CONFIGURATION/i)).toBeInTheDocument()
    expect(screen.getByText(/ISOLATION FORCE-FIELD/i)).toBeInTheDocument()
    expect(screen.getByText(/MOLT PRIVACY SHELL/i)).toBeInTheDocument()
  })

  it('handles FORCE PRIVATE action and displays confirmation alert', () => {
    const Component = Route.options.component!
    render(<Component />)

    // Open settings modal from video controls
    const settingsBtn = screen.getByRole('button', { name: /open protocol settings/i })
    fireEvent.click(settingsBtn)

    // Trigger FORCE PRIVATE
    const forcePrivateBtn = screen.getByRole('button', { name: /force private/i })
    fireEvent.click(forcePrivateBtn)

    // Verify toast notification appears
    expect(
      screen.getByText(/FORCE PRIVATE ENGAGED: EXTERNAL CONNECTIONS SHROUDED/i)
    ).toBeInTheDocument()
  })
})
