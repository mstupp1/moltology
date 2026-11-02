// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { HorizontalScroll } from './HorizontalScroll'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('HorizontalScroll', () => {
  it('shows only the edges with hidden content and clears fades when the row fits', () => {
    let resize = () => {}
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { resize = callback }
      observe() {}
      disconnect() {}
    })
    const ref = createRef<HTMLElement>()
    render(<HorizontalScroll as="nav" ref={ref} aria-label="Cards" style={{ overflowX: 'auto' }}>Cards</HorizontalScroll>)
    const row = ref.current!
    Object.defineProperties(row, { clientWidth: { configurable: true, value: 300 }, scrollWidth: { configurable: true, value: 900 } })
    act(resize)
    expect(row.dataset).toMatchObject({ fadeLeft: 'false', fadeRight: 'true' })
    act(() => { row.scrollLeft = 200; row.dispatchEvent(new Event('scroll')) })
    expect(row.dataset).toMatchObject({ fadeLeft: 'true', fadeRight: 'true' })
    act(() => { row.scrollLeft = 600; row.dispatchEvent(new Event('scroll')) })
    expect(row.dataset).toMatchObject({ fadeLeft: 'true', fadeRight: 'false' })
    Object.defineProperty(row, 'clientWidth', { value: 900 })
    act(resize)
    expect(row.dataset).toMatchObject({ fadeLeft: 'false', fadeRight: 'false' })
    expect(row.tagName).toBe('NAV')
    expect(row.tabIndex).toBe(0)
  })

  it('updates after asynchronous content changes and leaves wrapped desktop rows clear', async () => {
    const { container, rerender } = render(<HorizontalScroll style={{ overflowX: 'auto' }}>Loading</HorizontalScroll>)
    const row = container.firstElementChild as HTMLElement
    Object.defineProperties(row, { clientWidth: { value: 300 }, scrollWidth: { value: 600 } })
    rerender(<HorizontalScroll style={{ overflowX: 'auto' }}>Loaded cards</HorizontalScroll>)
    await act(async () => {})
    expect(row.dataset.fadeRight).toBe('true')
    rerender(<HorizontalScroll style={{ overflowX: 'visible' }}>Wrapped cards</HorizontalScroll>)
    await act(async () => {})
    expect(row.dataset).toMatchObject({ fadeLeft: 'false', fadeRight: 'false' })
  })
})
