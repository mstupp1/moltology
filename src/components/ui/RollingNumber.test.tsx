import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RollingNumber } from './RollingNumber'

describe('RollingNumber', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders initial state safely', () => {
    render(<RollingNumber value={4289} prefix="Units: " suffix=" units" />)
    expect(screen.getByText(/Units:/)).toBeInTheDocument()
  })

  it('formats decimals correctly', () => {
    render(<RollingNumber value={99.4} decimals={1} suffix="%" />)
    // Fast forward animation
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByText(/99\.4%/)).toBeInTheDocument()
  })

  it('reaches final target value after duration', () => {
    render(<RollingNumber value={100} duration={1000} />)
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(screen.getByText('100')).toBeInTheDocument()
  })
})
