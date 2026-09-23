import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimatedHamburger } from './AnimatedHamburger'

describe('AnimatedHamburger Component', () => {
  it('renders closed hamburger state with 3 horizontal parallel bars', () => {
    render(<AnimatedHamburger isOpen={false} />)

    const container = screen.getByTestId('animated-hamburger')
    expect(container).toBeInTheDocument()
    expect(container).toHaveAttribute('aria-hidden', 'true')

    const topBar = screen.getByTestId('hamburger-bar-top')
    const middleBar = screen.getByTestId('hamburger-bar-middle')
    const bottomBar = screen.getByTestId('hamburger-bar-bottom')

    expect(topBar).toHaveClass('-translate-y-[6px]', 'rotate-0')
    expect(middleBar).toHaveClass('opacity-100', 'scale-x-100')
    expect(bottomBar).toHaveClass('translate-y-[6px]', 'rotate-0')
  })

  it('renders open X state with top/bottom bars crossed into an X and middle bar collapsed', () => {
    render(<AnimatedHamburger isOpen={true} />)

    const topBar = screen.getByTestId('hamburger-bar-top')
    const middleBar = screen.getByTestId('hamburger-bar-middle')
    const bottomBar = screen.getByTestId('hamburger-bar-bottom')

    expect(topBar).toHaveClass('translate-y-0', 'rotate-45')
    expect(middleBar).toHaveClass('opacity-0', 'scale-x-0')
    expect(bottomBar).toHaveClass('translate-y-0', '-rotate-45')
  })

  it('renders without any text content to keep parent button textContent empty', () => {
    render(<AnimatedHamburger isOpen={false} />)
    const container = screen.getByTestId('animated-hamburger')
    expect(container.textContent).toBe('')
  })

  it('supports custom size presets (sm, md, lg)', () => {
    const { rerender } = render(<AnimatedHamburger isOpen={false} size="sm" />)
    expect(screen.getByTestId('animated-hamburger')).toHaveClass('w-4', 'h-4')
    expect(screen.getByTestId('hamburger-bar-top')).toHaveClass('-translate-y-[5px]')

    rerender(<AnimatedHamburger isOpen={false} size="lg" />)
    expect(screen.getByTestId('animated-hamburger')).toHaveClass('w-6', 'h-6')
    expect(screen.getByTestId('hamburger-bar-top')).toHaveClass('-translate-y-[7px]')
  })

  it('applies custom className and barClassName', () => {
    render(
      <AnimatedHamburger
        isOpen={true}
        className="text-cyan-300"
        barClassName="shadow-cyan"
      />
    )

    expect(screen.getByTestId('animated-hamburger')).toHaveClass('text-cyan-300')
    expect(screen.getByTestId('hamburger-bar-top')).toHaveClass('shadow-cyan')
  })
})
