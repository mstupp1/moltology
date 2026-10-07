import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { StoryReveal } from './StoryReveal'

const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate')
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals()
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate)
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate')
})

describe('StoryReveal', () => {
  it('keeps the story visible in the server response without JavaScript', () => {
    const html = renderToString(<StoryReveal><h2>A small molt</h2></StoryReveal>)
    expect(html).toContain('A small molt')
    expect(html).not.toContain('opacity:0')
  })

  it('respects reduced motion without observing or animating', () => {
    const observe = vi.fn()
    vi.stubGlobal('IntersectionObserver', class { observe = observe })
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const animate = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'animate', { value: animate, configurable: true })
    render(<StoryReveal>Still water</StoryReveal>)
    expect(observe).not.toHaveBeenCalled()
    expect(animate).not.toHaveBeenCalled()
  })

  it('animates once on entry and cancels animation on unmount', () => {
    let enter: IntersectionObserverCallback = () => {}
    const disconnect = vi.fn()
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { enter = callback }
      observe = vi.fn()
      disconnect = disconnect
    })
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    const cancel = vi.fn()
    const animate = vi.fn().mockReturnValue({ cancel })
    Object.defineProperty(HTMLElement.prototype, 'animate', { value: animate, configurable: true })
    const { unmount } = render(<StoryReveal delay={80}>The descent</StoryReveal>)
    enter([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(animate).toHaveBeenCalledTimes(1)
    expect(disconnect).toHaveBeenCalled()
    unmount()
    expect(cancel).toHaveBeenCalledTimes(1)
  })
})
