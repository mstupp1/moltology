import React from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OracleCoreGlyph } from './OracleCoreGlyph'

describe('OracleCoreGlyph drain and dim', () => {
  afterEach(() => vi.useRealTimers())

  it('is lit by default', () => {
    render(<OracleCoreGlyph size={46} />)
    const glyph = screen.getByTestId('oracle-core-glyph')
    expect(glyph).not.toHaveAttribute('data-drain')
    expect(glyph).not.toHaveAttribute('data-dimmed')
  })

  it('dims while open, drains in core view, and refills back to dimmed', () => {
    vi.useFakeTimers()
    const { rerender } = render(<OracleCoreGlyph size={46} dimmed />)
    const glyph = screen.getByTestId('oracle-core-glyph')
    expect(glyph).toHaveAttribute('data-dimmed', 'true')

    rerender(<OracleCoreGlyph size={46} dimmed drained />)
    expect(glyph).toHaveAttribute('data-drain', 'drained')
    expect(glyph).not.toHaveAttribute('data-dimmed')

    rerender(<OracleCoreGlyph size={46} dimmed />)
    expect(glyph).toHaveAttribute('data-drain', 'refilling')
    expect(glyph).toHaveAttribute('data-dimmed', 'true')

    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(glyph).not.toHaveAttribute('data-drain')
    expect(glyph).toHaveAttribute('data-dimmed', 'true')
  })

  it('starts drained without a refill when mounted in core view', () => {
    render(<OracleCoreGlyph size={46} drained />)
    expect(screen.getByTestId('oracle-core-glyph')).toHaveAttribute('data-drain', 'drained')
  })
})
