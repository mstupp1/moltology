import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AutoLoadMore } from './AutoLoadMore'

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void
let observers: Array<{ cb: Callback; disconnected: boolean }> = []

class FakeObserver {
  private entry: { cb: Callback; disconnected: boolean }
  constructor(cb: Callback) {
    this.entry = { cb, disconnected: false }
    observers.push(this.entry)
  }
  observe() {}
  disconnect() {
    this.entry.disconnected = true
  }
}

function showEnd() {
  const live = observers.filter((o) => !o.disconnected)
  act(() => live.forEach((o) => o.cb([{ isIntersecting: true }])))
}

describe('AutoLoadMore', () => {
  beforeEach(() => {
    observers = []
    vi.stubGlobal('IntersectionObserver', FakeObserver)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('loads when the end of the list comes near, with no button', () => {
    const onLoad = vi.fn()
    render(<AutoLoadMore onLoad={onLoad} loading={false} testId="more" />)
    expect(screen.queryByRole('button')).toBeNull()
    showEnd()
    expect(onLoad).toHaveBeenCalledTimes(1)
  })

  it('shows a spinner while loading and does not load twice', () => {
    const onLoad = vi.fn()
    render(<AutoLoadMore onLoad={onLoad} loading testId="more" />)
    expect(screen.getByRole('status')).toBeTruthy()
    showEnd()
    expect(onLoad).not.toHaveBeenCalled()
  })

  it('offers Try again after a failed load', async () => {
    const onLoad = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
    render(<AutoLoadMore onLoad={onLoad} loading={false} testId="more" />)
    showEnd()
    const retry = await screen.findByRole('button', { name: 'Try again' })
    fireEvent.click(retry)
    expect(onLoad).toHaveBeenCalledTimes(2)
  })

  it('falls back to a button where scrolling cannot be watched', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const onLoad = vi.fn()
    render(<AutoLoadMore onLoad={onLoad} loading={false} label="Load more posts" />)
    fireEvent.click(screen.getByRole('button', { name: 'Load more posts' }))
    expect(onLoad).toHaveBeenCalledTimes(1)
  })
})
