import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BrandIcon, BrandWordmark } from './BrandMark'

describe('production brand vectors', () => {
  it('defaults to the application red and supports inherited color', () => {
    const { rerender } = render(<BrandIcon />)
    expect(screen.getByRole('img')).toHaveClass('text-crimson-aggro')
    expect(screen.getByRole('img').querySelector('g')).toHaveAttribute('fill', 'currentColor')
    rerender(<BrandIcon tone="inherit" style={{ color: 'rebeccapurple' }} />)
    expect(screen.getByRole('img')).not.toHaveClass('text-crimson-aggro')
    expect(screen.getByRole('img')).toHaveStyle({ color: 'rgb(102, 51, 153)' })
  })

  it('does not announce decorative emblems', () => {
    const { container } = render(<BrandIcon aria-hidden="true" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).not.toHaveAttribute('aria-label')
  })

  it('keeps canonical labels accessible while rendering outlined lettering', () => {
    const { container } = render(<BrandWordmark text="BENTHIC CORE" />)
    expect(screen.getByText('BENTHIC CORE')).toHaveClass('sr-only')
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('path')).toHaveAttribute('fill-rule', 'evenodd')
    expect(container.querySelector('image')).toBeNull()
  })

  it('preserves arbitrary live copy and handles server rendering without IDs', () => {
    const { container } = render(<BrandWordmark text="CUSTOM FOUNDATION" />)
    expect(screen.getByText('CUSTOM FOUNDATION')).toBeVisible()
    expect(container.querySelector('svg')).toBeNull()
    const html = renderToString(<><BrandIcon /><BrandIcon /></>)
    expect(html).not.toContain('id=')
    expect(html.match(/aria-label="Order Emblem"/g)).toHaveLength(2)
  })
})
