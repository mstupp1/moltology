import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UnderwaterBubblesCanvas, createChromaKeyedSprite } from './UnderwaterBubblesCanvas'

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
      stroke: vi.fn(),
      drawImage: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
    })

    HTMLCanvasElement.prototype.getContext = getContextMock

    render(<UnderwaterBubblesCanvas bubbleCount={15} customBubbleSrc="/images/custom_bubble.png" chromaKeyMode="green" />)

    expect(getContextMock).toHaveBeenCalledWith('2d', { alpha: true })
  })

  it('processes green/black background keying via createChromaKeyedSprite helper', () => {
    const mockImageData = {
      data: new Uint8ClampedArray([
        0, 200, 0, 255, // Green key pixel
        10, 10, 10, 255, // Black key pixel
        255, 255, 255, 255 // White foreground pixel
      ]),
      width: 3,
      height: 1,
    }

    const mockCtx = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue(mockImageData),
      putImageData: vi.fn(),
    }

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx)

    const mockCanvas = {
      width: 128,
      height: 128,
    } as unknown as HTMLCanvasElement

    const spriteCanvas = createChromaKeyedSprite(mockCanvas, 'auto')

    expect(spriteCanvas).toBeInstanceOf(HTMLCanvasElement)
    expect(mockCtx.getImageData).toHaveBeenCalledWith(0, 0, 128, 128)
    expect(mockCtx.putImageData).toHaveBeenCalled()
    // Green pixel (index 0) and Black pixel (index 4) alpha channels set to 0, white (index 8) stays 255
    expect(mockImageData.data[3]).toBe(0)
    expect(mockImageData.data[7]).toBe(0)
    expect(mockImageData.data[11]).toBe(255)
  })

  it('correctly keys only black pixels when chromaKeyMode="black"', () => {
    const mockImageData = {
      data: new Uint8ClampedArray([
        0, 200, 0, 255, // Green pixel (should NOT be keyed when mode is black)
        10, 10, 10, 255, // Black pixel (should be keyed)
        255, 255, 255, 255 // White foreground pixel (should NOT be keyed)
      ]),
      width: 3,
      height: 1,
    }

    const mockCtx = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue(mockImageData),
      putImageData: vi.fn(),
    }

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx)

    const mockCanvas = {
      width: 128,
      height: 128,
    } as unknown as HTMLCanvasElement

    createChromaKeyedSprite(mockCanvas, 'black')

    expect(mockImageData.data[3]).toBe(255) // Green pixel stays opaque
    expect(mockImageData.data[7]).toBe(0)   // Black pixel becomes transparent
    expect(mockImageData.data[11]).toBe(255) // White pixel stays opaque
  })

})

