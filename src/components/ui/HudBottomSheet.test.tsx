import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { HudBottomSheet } from './HudBottomSheet'

describe('HudBottomSheet Component', () => {
  it('renders bottom sheet content when open with top drag handle', () => {
    render(
      <HudBottomSheet isOpen={true} onClose={vi.fn()} title="Test Activity Modal">
        <div>Activity Center Content</div>
      </HudBottomSheet>
    )

    expect(screen.getByRole('dialog', { name: 'Test Activity Modal' })).toBeInTheDocument()
    expect(screen.getByText('Activity Center Content')).toBeInTheDocument()
    expect(screen.getByLabelText('Drag handle to close')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(
      <HudBottomSheet isOpen={false} onClose={vi.fn()} title="Hidden Modal">
        <div>Hidden Content</div>
      </HudBottomSheet>
    )

    expect(screen.queryByRole('dialog', { name: 'Hidden Modal' })).not.toBeInTheDocument()
    expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument()
  })

  it('locks body scroll when open and restores on unmount', () => {
    const { unmount } = render(
      <HudBottomSheet isOpen={true} onClose={vi.fn()}>
        <div>Scroll Lock Test</div>
      </HudBottomSheet>
    )

    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('triggers smooth close callback when backdrop overlay is clicked', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()

    const { container } = render(
      <HudBottomSheet isOpen={true} onClose={onClose}>
        <div>Backdrop Click Test</div>
      </HudBottomSheet>
    )

    // First wait for initial render timer
    act(() => {
      vi.advanceTimersByTime(50)
    })

    const backdrop = document.querySelector('.bg-black\\/80')
    expect(backdrop).toBeInTheDocument()
    if (backdrop) {
      fireEvent.click(backdrop)
    }

    // Exit animation timer
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('triggers smooth close callback when Escape key is pressed', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()

    render(
      <HudBottomSheet isOpen={true} onClose={onClose}>
        <div>Escape Key Test</div>
      </HudBottomSheet>
    )

    act(() => {
      vi.advanceTimersByTime(50)
    })

    fireEvent.keyDown(window, { key: 'Escape' })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('supports touch drag down gesture past threshold to close', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()

    render(
      <HudBottomSheet isOpen={true} onClose={onClose} dragThreshold={50}>
        <div>Drag Test Content</div>
      </HudBottomSheet>
    )

    act(() => {
      vi.advanceTimersByTime(50)
    })

    const handle = screen.getByLabelText('Drag handle to close')
    expect(handle).toBeInTheDocument()

    // Simulate drag start at Y: 100
    fireEvent.touchStart(handle, {
      touches: [{ clientY: 100 }],
    })

    // Simulate drag move down to Y: 220 (delta = 120px > 50px threshold)
    fireEvent.touchMove(handle, {
      touches: [{ clientY: 220 }],
    })

    // Simulate touch release
    fireEvent.touchEnd(handle)

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('renders fill layout without default scroll/padding classes', () => {
    render(
      <HudBottomSheet isOpen={true} onClose={vi.fn()} contentLayout="fill" title="Fill Modal">
        <div data-testid="fill-content">Full height content</div>
      </HudBottomSheet>
    )

    const dialog = screen.getByRole('dialog', { name: /Fill Modal/i })
    expect(dialog.className).toContain('flex flex-col p-0 overflow-hidden')
    expect(screen.getByTestId('fill-content')).toBeInTheDocument()
  })
})
