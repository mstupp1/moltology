import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HUDErrorBoundary, HUDErrorFallback } from './HUDErrorBoundary'

function ProblematicComponent({ shouldThrow }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test quantum core rupture error')
  }
  return <div data-testid="normal-content">System operational</div>
}

describe('HUDErrorBoundary & HUDErrorFallback', () => {
  it('renders normal children when no error occurs', () => {
    render(
      <HUDErrorBoundary>
        <ProblematicComponent />
      </HUDErrorBoundary>
    )

    expect(screen.getByTestId('normal-content')).toBeInTheDocument()
    expect(screen.getByText('System operational')).toBeInTheDocument()
  })

  it('renders HUD error fallback screen when an error is thrown', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <HUDErrorBoundary>
        <ProblematicComponent shouldThrow />
      </HUDErrorBoundary>
    )

    expect(screen.getByText('[CRITICAL ANOMALOUS OVERFLOW]')).toBeInTheDocument()
    expect(screen.getByText('SYNAPTIC LINK CORRUPTED')).toBeInTheDocument()
    expect(screen.getByText('Test quantum core rupture error')).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it('allows expanding telemetry dump / stack trace details', () => {
    const customError = new Error('Stack trace test error')
    customError.stack = 'Error: Stack trace test error\n    at TestCall (file.ts:10)'

    render(<HUDErrorFallback error={customError} />)

    const toggleBtn = screen.getByText('INSPECT TELEMETRY DUMP')
    expect(screen.queryByText(/at TestCall/)).not.toBeInTheDocument()

    fireEvent.click(toggleBtn)
    expect(screen.getByText(/at TestCall/)).toBeInTheDocument()
  })

  it('calls reset handler when REINITIALIZE CORE button is clicked', () => {
    const onResetMock = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <HUDErrorBoundary onReset={onResetMock}>
        <ProblematicComponent shouldThrow />
      </HUDErrorBoundary>
    )

    const reinitButton = screen.getByRole('button', { name: /REINITIALIZE CORE/i })
    fireEvent.click(reinitButton)

    expect(onResetMock).toHaveBeenCalledTimes(1)
    consoleError.mockRestore()
  })
})
