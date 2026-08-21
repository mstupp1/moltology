import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { HUDTopLoadingBar } from './HUDTopLoadingBar'

vi.mock('@tanstack/react-router', () => ({
  useRouterState: vi.fn((opts) => {
    if (typeof opts?.select === 'function') {
      return opts.select({ status: 'pending', isLoading: true })
    }
    return { status: 'pending', isLoading: true }
  }),
}))

describe('HUDTopLoadingBar', () => {
  it('renders top progress bar when navigation is pending', () => {
    const { container } = render(<HUDTopLoadingBar />)
    expect(container.querySelector('[data-testid="hud-top-loading-bar"]')).toBeInTheDocument()
  })
})
