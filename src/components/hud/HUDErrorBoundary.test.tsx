import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

  it('renders clean error fallback screen when an error is thrown', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <HUDErrorBoundary>
        <ProblematicComponent shouldThrow />
      </HUDErrorBoundary>
    )

    expect(screen.getByText('Application Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test quantum core rupture error')).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it('allows expanding technical details / stack trace', () => {
    const customError = new Error('Stack trace test error')
    customError.stack = 'Error: Stack trace test error\n    at TestCall (file.ts:10)'

    render(<HUDErrorFallback error={customError} />)

    const toggleBtn = screen.getByText('Show technical details')
    expect(screen.queryByText(/at TestCall/)).not.toBeInTheDocument()

    fireEvent.click(toggleBtn)
    expect(screen.getByText(/at TestCall/)).toBeInTheDocument()
    expect(screen.getByText('Hide technical details')).toBeInTheDocument()
  })

  it('copies error details to clipboard when Copy Error Details is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    const customError = new Error('Clipboard copy error')
    customError.stack = 'Error: Clipboard copy error\n    at Fn (file.ts:5)'

    render(<HUDErrorFallback error={customError} />)

    const copyBtn = screen.getByRole('button', { name: /Copy Error Details/i })
    fireEvent.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('Error: Clipboard copy error'))
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('at Fn (file.ts:5)'))

    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument()
    })
  })

  it('calls reset handler when Reload Page button is clicked', () => {
    const onResetMock = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <HUDErrorBoundary onReset={onResetMock}>
        <ProblematicComponent shouldThrow />
      </HUDErrorBoundary>
    )

    const reloadButton = screen.getByRole('button', { name: /Reload Page/i })
    fireEvent.click(reloadButton)

    expect(onResetMock).toHaveBeenCalledTimes(1)
    consoleError.mockRestore()
  })
})


