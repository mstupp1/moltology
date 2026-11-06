import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LobsterAvatarSilhouette } from './LobsterAvatarSilhouette'
import { LOBSTER_PORTRAIT_VIEWBOX } from '../../lib/lobster-avatar'

describe('LobsterAvatarSilhouette Component', () => {
  it('renders portrait SVG silhouette with accessible role, antennae, and carapace dome', () => {
    render(<LobsterAvatarSilhouette alt="Custom silhouette" className="w-12 h-12" />)

    const el = screen.getByTestId('lobster-avatar-silhouette')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('role', 'img')
    expect(el).toHaveAttribute('aria-label', 'Custom silhouette')
    expect(el.getAttribute('viewBox')).toBe(LOBSTER_PORTRAIT_VIEWBOX)
    expect(el).toHaveAttribute('data-avatar-slot', 'portrait')

    // Antennae, antennules and the carapace dome; no face (it stays a plain placeholder)
    const paths = el.querySelectorAll('path')
    expect(paths.length).toBe(7)
    expect(el.querySelectorAll('circle').length).toBe(0)
  })

  it('renders close-up portrait SVG silhouette consistently even when rendered in fullBody slot', () => {
    render(<LobsterAvatarSilhouette frame="fullBody" alt="Chassis silhouette" />)

    const el = screen.getByTestId('lobster-avatar-silhouette')
    expect(el).toBeInTheDocument()
    expect(el.getAttribute('viewBox')).toBe(LOBSTER_PORTRAIT_VIEWBOX)
    expect(el).toHaveAttribute('data-avatar-slot', 'portrait')
  })
})
