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

    const emblem = screen.getByRole('img', { name: 'Loading' })
    expect(emblem).toBeInTheDocument()
    expect(emblem.querySelector('img')).toHaveAttribute('src', '/images/emblem/turntable.webp')
  })

  it('renders cleanly without extra text paragraphs or boot logs', () => {
    const { container } = render(<HUDPageLoader />)
    expect(container.querySelector('p')).toBeNull()
    // Only the glowing emblem: no visible words.
    const visible = container.cloneNode(true) as HTMLElement
    visible.querySelectorAll('style').forEach((style) => style.remove())
    expect(visible.textContent?.trim()).toBe('')
    expect(screen.queryByText(/INITIALIZING/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/MOLTOLOGY/i)).not.toBeInTheDocument()
  })
})
