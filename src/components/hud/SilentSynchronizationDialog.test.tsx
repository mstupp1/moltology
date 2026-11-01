import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SilentSynchronizationDialog } from './SilentSynchronizationDialog'

vi.mock('@/components/ui/HudBottomSheet', () => ({
  HudBottomSheet: ({ isOpen, children, onClose }: { isOpen: boolean; children: React.ReactNode; onClose: () => void }) =>
    isOpen ? <div role="dialog"><button aria-label="backdrop" onClick={onClose} />{children}</div> : null,
}))

describe('SilentSynchronizationDialog completion', () => {
  let onClose: ReturnType<typeof vi.fn<() => void>>
  let onComplete: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    onClose = vi.fn<() => void>()
    onComplete = vi.fn<() => void>()
  })

  afterEach(() => vi.useRealTimers())

  it('does not complete when dismissed before starting', () => {
    const view = render(<SilentSynchronizationDialog open onClose={onClose} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
    view.rerender(<SilentSynchronizationDialog open={false} onClose={onClose} onComplete={onComplete} />)
    expect(onClose).toHaveBeenCalledOnce()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('completes once when dismissed after starting', () => {
    const view = render(<SilentSynchronizationDialog open onClose={onClose} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))
    view.rerender(<SilentSynchronizationDialog open={false} onClose={onClose} onComplete={onComplete} />)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('completes early on Stop and guards later dismissals', () => {
    const view = render(<SilentSynchronizationDialog open onClose={onClose} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onComplete).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    view.rerender(<SilentSynchronizationDialog open={false} onClose={onClose} onComplete={onComplete} />)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('completes naturally at the selected deadline and remains open', () => {
    render(<SilentSynchronizationDialog open onClose={onClose} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))
    act(() => { vi.advanceTimersByTime(180_000) })
    expect(onComplete).toHaveBeenCalledOnce()
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Session complete')).toBeTruthy()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('keeps completion idempotent when stopped and then dismissed repeatedly', () => {
    const view = render(<SilentSynchronizationDialog open onClose={onClose} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    view.rerender(<SilentSynchronizationDialog open={false} onClose={onClose} onComplete={onComplete} />)
    view.rerender(<SilentSynchronizationDialog open onClose={onClose} onComplete={onComplete} />)
    view.rerender(<SilentSynchronizationDialog open={false} onClose={onClose} onComplete={onComplete} />)
    expect(onComplete).toHaveBeenCalledOnce()
  })
})
