import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import {
  HudGhostSkeleton,
  HudGhostCard,
  HudGhostStatBox,
  HudGhostWidget,
} from './HudGhostLoader'

describe('HudGhostLoader Primitives', () => {
  describe('HudGhostSkeleton', () => {
    it('renders ghost skeleton element with default neutral variant', () => {
      const { container } = render(<HudGhostSkeleton width={150} height={30} />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('animate-pulse')
      expect(skeleton).toHaveClass('bg-[#101515]')
      expect(skeleton).toHaveStyle({ width: '150px', height: '30px' })
    })

    it('renders with crimson variant and custom preset', () => {
      const { container } = render(
        <HudGhostSkeleton variant="crimson" preset="badge" />
      )
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('bg-[#180d0d]')
    })
  })

  describe('HudGhostCard', () => {
    it('renders ghost card container with line skeletons', () => {
      const { container } = render(<HudGhostCard lines={3} variant="teal" />)
      expect(container.firstChild).toHaveClass('rounded-sm')
    })
  })

  describe('HudGhostStatBox', () => {
    it('renders ghost stat box placeholder', () => {
      const { container } = render(<HudGhostStatBox variant="cyan" />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('HudGhostWidget', () => {
    it('renders skeleton when isLoading is true', () => {
      render(
        <HudGhostWidget
          isLoading={true}
          skeleton={<div data-testid="ghost-skeleton">GHOST LOADING</div>}
        >
          <div data-testid="live-content">LIVE CONTENT</div>
        </HudGhostWidget>
      )

      expect(screen.getByTestId('ghost-skeleton')).toBeInTheDocument()
      expect(screen.queryByTestId('live-content')).not.toBeInTheDocument()
    })

    it('renders children live content when isLoading is false', () => {
      render(
        <HudGhostWidget
          isLoading={false}
          skeleton={<div data-testid="ghost-skeleton">GHOST LOADING</div>}
        >
          <div data-testid="live-content">LIVE CONTENT</div>
        </HudGhostWidget>
      )

      expect(screen.queryByTestId('ghost-skeleton')).not.toBeInTheDocument()
      expect(screen.getByTestId('live-content')).toBeInTheDocument()
    })
  })
})
