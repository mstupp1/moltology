import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LayoutSlide } from './LayoutSlide'

describe('LayoutSlide', () => {
  it('renders layers at the canvas size with highlighted words and the fallback mascot', () => {
    const { container } = render(
      <LayoutSlide
        mascot="crab_stats"
        spec={{
          aspect: '3:4',
          layers: [
            { type: 'text', text: 'Close 46 tabs.', highlight: '46', size: 90, box: { x: 6, y: 10, w: 80, h: 20 } },
            { type: 'button', text: 'Join free', box: { x: 6, y: 80, w: 40, h: 6 } },
            { type: 'mascot', box: { x: 50, y: 40, w: 45, h: 50 } },
            { type: 'list', items: ['One', 'Two'], size: 30, marker: 'number', box: { x: 6, y: 50, w: 40 } },
            { type: 'brand', variant: 'lockup', caption: 'moltology.org', box: { x: 6, y: 90, w: 40 } },
          ],
        }}
      />
    )
    const root = container.querySelector('[data-composite-root]') as HTMLElement
    expect(root.style.width).toBe('1080px')
    expect(root.style.height).toBe('1440px')
    expect(screen.getByText('46').style.color).toBeTruthy()
    expect(screen.getByText('Join free')).toBeInTheDocument()
    expect(container.querySelector('[data-mascot-key="crab_stats"]')).not.toBeNull()
    expect(screen.getByText('2.')).toBeInTheDocument()
    expect(container.querySelector('[data-fit]')).not.toBeNull()
    expect(screen.getByText('Moltology')).toBeInTheDocument()
    expect(screen.getByText('moltology.org')).toBeInTheDocument()
  })
})
