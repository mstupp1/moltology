import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HUDSpinner } from './HUDSpinner'

describe('HUDSpinner Component', () => {
  it('renders default cyan spinner with status role', () => {
    render(<HUDSpinner />)

    const statusEl = screen.getByRole('status')
    expect(statusEl).toBeInTheDocument()
    expect(statusEl).toHaveAttribute('aria-label', 'Loading')
  })

  it('renders custom label when provided', () => {
    render(<HUDSpinner label="FETCHING DATA..." variant="crimson" size="lg" />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'FETCHING DATA...')
    expect(screen.getByText('FETCHING DATA...')).toBeInTheDocument()
  })

  it('applies custom className and sizes', () => {
    const { container } = render(<HUDSpinner size="sm" className="my-custom-spinner" />)

    expect(container.querySelector('.my-custom-spinner')).toBeInTheDocument()
  })
})
