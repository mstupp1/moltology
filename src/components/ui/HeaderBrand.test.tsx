import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HeaderBrand } from './HeaderBrand'

describe('HeaderBrand Component', () => {
  it('renders default title in proper case and subtext correctly when provided', () => {
    render(<HeaderBrand subtext="MOLTOLOGY.ORG FOUNDATION" />)

    expect(screen.getByText('Moltology')).toBeInTheDocument()
    expect(screen.getByText('MOLTOLOGY.ORG FOUNDATION')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Order Emblem' }).tagName.toLowerCase()).toBe('svg')
  })

  it('renders clean title without subtext by default', () => {
    render(<HeaderBrand />)

    const titleEl = screen.getByText('Moltology')
    expect(titleEl).toBeInTheDocument()
    expect(titleEl.closest('div')?.className).not.toContain('uppercase')
    expect(screen.queryByText('MOLTOLOGY.ORG FOUNDATION')).not.toBeInTheDocument()
  })

  it('hides text when isCollapsed is true', () => {
    render(<HeaderBrand isCollapsed={true} subtext="BENTHIC CORE" />)

    expect(screen.getByRole('img', { name: 'Order Emblem' })).toBeInTheDocument()
    expect(screen.queryByText('Moltology')).not.toBeInTheDocument()
    expect(screen.queryByText('BENTHIC CORE')).not.toBeInTheDocument()
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<HeaderBrand onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders corporate variant with sky styling classes', () => {
    render(<HeaderBrand variant="corporate" subtext="MOLTOLOGY.ORG FOUNDATION" />)

    const titleEl = screen.getByText('Moltology')
    expect(titleEl.closest('div')?.className).toContain('text-sky-950')
    const subtextEl = screen.getByText('MOLTOLOGY.ORG FOUNDATION')
    expect(subtextEl.closest('div')?.className).toContain('text-sky-600')
  })

  it('only renders a keyboard-focusable button when it has an action', () => {
    const { rerender } = render(<HeaderBrand />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    rerender(<HeaderBrand onClick={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('supports custom titles and subtitles without dropping their text', () => {
    render(<HeaderBrand brandTitle="SYNAPTIC VAULT" subtext="CUSTOM SUBTITLE" />)
    expect(screen.getByText('SYNAPTIC VAULT')).toBeVisible()
    expect(screen.getByText('CUSTOM SUBTITLE')).toBeVisible()
  })

  it('renders badge next to title when expanded and hides badge when collapsed', () => {
    const { rerender } = render(
      <HeaderBrand badge={<span data-testid="test-badge">Go Premium</span>} />
    )
    expect(screen.getByTestId('test-badge')).toBeInTheDocument()

    rerender(
      <HeaderBrand isCollapsed={true} badge={<span data-testid="test-badge">Go Premium</span>} />
    )
    expect(screen.queryByTestId('test-badge')).not.toBeInTheDocument()
  })

  it('handles badge clicks independently without triggering brand onClick', () => {
    const handleBrandClick = vi.fn()
    const handleBadgeClick = vi.fn()

    render(
      <HeaderBrand
        onClick={handleBrandClick}
        badge={
          <button data-testid="badge-btn" onClick={handleBadgeClick}>
            Go Premium
          </button>
        }
      />
    )

    const badgeBtn = screen.getByTestId('badge-btn')
    fireEvent.click(badgeBtn)

    expect(handleBadgeClick).toHaveBeenCalledTimes(1)
    expect(handleBrandClick).not.toHaveBeenCalled()
  })
})

