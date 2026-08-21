import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HUDPageLoader } from './HUDPageLoader'

describe('HUDPageLoader Component', () => {
  it('renders loading status role and emblem image', () => {
    render(<HUDPageLoader />)

    const statusEl = screen.getByRole('status')
    expect(statusEl).toBeInTheDocument()
    expect(statusEl).toHaveAttribute('aria-label', 'Loading')

    const emblem = screen.getByAltText('Loading')
    expect(emblem).toBeInTheDocument()
    expect(emblem).toHaveAttribute('src', '/images/order_emblem.png')
  })

  it('renders cleanly without extra text paragraphs or boot logs', () => {
    const { container } = render(<HUDPageLoader />)
    expect(container.querySelector('p')).toBeNull()
    expect(container.querySelector('span')).toBeNull()
    expect(screen.queryByText(/INITIALIZING/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/MOLTOLOGY/i)).not.toBeInTheDocument()
  })
})
