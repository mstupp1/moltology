import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from './ToastProvider'

function TestComponent() {
  const { toast, addToast, clearToasts } = useToast()

  return (
    <div>
      <button onClick={() => toast.info('Info notice message', { title: 'Notice Title' })}>
        Trigger Info Toast
      </button>
      <button onClick={() => toast.success('Transformation success!')}>
        Trigger Success Toast
      </button>
      <button onClick={() => toast.warning('Warning warning alert!')}>
        Trigger Warning Toast
      </button>
      <button onClick={() => toast.error('Critical failure occurred!')}>
        Trigger Error Toast
      </button>
      <button onClick={() => toast.hud('Neural link active', { duration: 1000 })}>
        Trigger HUD Toast
      </button>
      <button onClick={() => addToast('Custom toast message', { id: 'custom-1', duration: 0 })}>
        Trigger Custom Toast
      </button>
      <button onClick={() => clearToasts()}>Clear All</button>
    </div>
  )
}

describe('ToastProvider & useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('throws an error when useToast is used outside of ToastProvider', () => {
    // Suppress console.error output for expected error throw
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    function ErrorConsumer() {
      useToast()
      return null
    }

    expect(() => render(<ErrorConsumer />)).toThrow('useToast must be used within a ToastProvider')
    consoleError.mockRestore()
  })

  it('renders children correctly', () => {
    render(
      <ToastProvider>
        <div data-testid="child-element">Sub-Node</div>
      </ToastProvider>
    )
    expect(screen.getByTestId('child-element')).toBeInTheDocument()
  })

  it('adds and renders toast notifications when triggered', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Trigger Info Toast'))

    expect(screen.getByText('SYSTEM NOTICE')).toBeInTheDocument()
    expect(screen.getByText('Notice Title')).toBeInTheDocument()
    expect(screen.getByText('Info notice message')).toBeInTheDocument()
  })

  it('supports different toast categories (success, warning, error, hud)', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Trigger Success Toast'))
    expect(screen.getByText('ASCENSION CONFIRMED')).toBeInTheDocument()
    expect(screen.getByText('Transformation success!')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Trigger Warning Toast'))
    expect(screen.getByText('WARNING DETECTED')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Trigger Error Toast'))
    expect(screen.getByText('ANOMALY ALERT')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Trigger HUD Toast'))
    expect(screen.getByText('NEURAL SIGNAL')).toBeInTheDocument()
  })

  it('allows manual dismissal of a toast notification', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Trigger Custom Toast'))
    expect(screen.getByText('Custom toast message')).toBeInTheDocument()

    const dismissBtn = screen.getByRole('button', { name: 'Dismiss notification' })
    fireEvent.click(dismissBtn)

    expect(screen.queryByText('Custom toast message')).not.toBeInTheDocument()
  })

  it('auto-dismisses toasts after duration elapses', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Trigger HUD Toast'))
    expect(screen.getByText('Neural link active')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(screen.queryByText('Neural link active')).not.toBeInTheDocument()
  })

  it('clears all active toasts via clearToasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Trigger Info Toast'))
    fireEvent.click(screen.getByText('Trigger Success Toast'))

    expect(screen.getByText('Info notice message')).toBeInTheDocument()
    expect(screen.getByText('Transformation success!')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Clear All'))

    expect(screen.queryByText('Info notice message')).not.toBeInTheDocument()
    expect(screen.queryByText('Transformation success!')).not.toBeInTheDocument()
  })

  it('deduplicates identical toast messages triggered rapidly to prevent visual duplicates', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Click 3 times in rapid succession
    fireEvent.click(screen.getByText('Trigger Info Toast'))
    fireEvent.click(screen.getByText('Trigger Info Toast'))
    fireEvent.click(screen.getByText('Trigger Info Toast'))

    const toasts = screen.getAllByText('Info notice message')
    expect(toasts).toHaveLength(1)
  })

  it('deduplicates toasts with the same ID', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Trigger custom toast with explicit id 'custom-1' multiple times
    fireEvent.click(screen.getByText('Trigger Custom Toast'))
    fireEvent.click(screen.getByText('Trigger Custom Toast'))
    fireEvent.click(screen.getByText('Trigger Custom Toast'))

    const customToasts = screen.getAllByText('Custom toast message')
    expect(customToasts).toHaveLength(1)
  })
})
