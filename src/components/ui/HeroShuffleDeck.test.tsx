import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HeroShuffleDeck } from './HeroShuffleDeck'

describe('HeroShuffleDeck Component', () => {
  it('renders minimal video container with hover-only controls', () => {
    render(<HeroShuffleDeck />)

    const nextBtn = screen.getByRole('button', { name: /next video transmission/i })
    const prevBtn = screen.getByRole('button', { name: /previous video transmission/i })

    expect(nextBtn).toBeInTheDocument()
    expect(prevBtn).toBeInTheDocument()
    expect(nextBtn.className).toContain('opacity-0 group-hover:opacity-100')
  })

  it('navigates next and previous using chevron buttons', () => {
    render(<HeroShuffleDeck />)

    const nextBtn = screen.getByRole('button', { name: /next video transmission/i })
    const prevBtn = screen.getByRole('button', { name: /previous video transmission/i })

    // Click Next -> moves to Card 2 (ASSET TRANSMUTATION)
    fireEvent.click(nextBtn)
    expect(screen.getByRole('button', { name: /jump to asset transmutation/i })).toBeInTheDocument()

    // Click Prev -> moves back to Card 1
    fireEvent.click(prevBtn)
    expect(screen.getByRole('button', { name: /jump to cyber-benthic ascension/i })).toBeInTheDocument()
  })

  it('allows direct jumping via bottom slider indicators', () => {
    render(<HeroShuffleDeck />)

    const jumpBtn4 = screen.getByRole('button', { name: /jump to total carcinization/i })
    fireEvent.click(jumpBtn4)

    expect(jumpBtn4).toBeInTheDocument()
  })

  it('supports touch swipe gestures to advance slides on mobile', () => {
    const { container } = render(<HeroShuffleDeck />)
    const deck = container.firstChild as HTMLElement

    // Swipe Left (touchStart at 200, touchEnd at 100 -> diff 100 > 45) -> Next Card
    fireEvent.touchStart(deck, { targetTouches: [{ clientX: 200 }] })
    fireEvent.touchMove(deck, { targetTouches: [{ clientX: 100 }] })
    fireEvent.touchEnd(deck)

    expect(screen.getByRole('button', { name: /jump to asset transmutation/i })).toBeInTheDocument()

    // Swipe Right (touchStart at 100, touchEnd at 200 -> diff -100 < -45) -> Previous Card
    fireEvent.touchStart(deck, { targetTouches: [{ clientX: 100 }] })
    fireEvent.touchMove(deck, { targetTouches: [{ clientX: 200 }] })
    fireEvent.touchEnd(deck)

    expect(screen.getByRole('button', { name: /jump to cyber-benthic ascension/i })).toBeInTheDocument()
  })
})
