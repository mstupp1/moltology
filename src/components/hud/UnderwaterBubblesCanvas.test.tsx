import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UnderwaterBubblesCanvas } from './UnderwaterBubblesCanvas'

describe('UnderwaterBubblesCanvas Component', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb) => {
        return setTimeout(cb, 16) as unknown as number
      })
    )
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id) => clearTimeout(id))
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders canvas element with proper data-testid and custom className', () => {
    render(<UnderwaterBubblesCanvas bubbleCount={20} className="custom-bubble-class" />)

    const canvas = screen.getByTestId('underwater-bubbles-canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas).toHaveClass('custom-bubble-class')
  })

  it('initializes HTML5 canvas context without throwing errors', () => {
    const getContextMock = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
    })

    HTMLCanvasElement.prototype.getContext = getContextMock

    render(<UnderwaterBubblesCanvas bubbleCount={15} />)

    expect(getContextMock).toHaveBeenCalledWith('2d', { alpha: true })
  })
})
