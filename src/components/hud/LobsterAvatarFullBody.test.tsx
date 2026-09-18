import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LobsterAvatarFullBody } from './LobsterAvatarFullBody'
import { resetLobsterFullBodyMotionForTests } from '@/lib/lobster-avatar-slots'

const testSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="red"/></svg>'
const testSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(testSvg)}`

function mockMatchMedia(reducedMotion = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('LobsterAvatarFullBody Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetLobsterFullBodyMotionForTests()
    mockMatchMedia(false)
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  })

  afterEach(() => {
    resetLobsterFullBodyMotionForTests()
  })

  it('mounts the animated full-body slot', async () => {
    render(<LobsterAvatarFullBody src={testSrc} alt="Stage preview" />)

    expect(screen.getByTestId('lobster-avatar-full-body')).toHaveAttribute('data-slot', 'fullBody')
    await waitFor(() => {
      expect(screen.getByTestId('lobster-avatar-inline-svg')).toBeInTheDocument()
    })
    expect(screen.getByTestId('lobster-avatar-inline-svg')).toHaveClass('lobster-avatar-animated')
  })

  it('does not load the animated instance when the document is hidden', async () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    render(<LobsterAvatarFullBody src={testSrc} alt="Hidden stage" />)

    await waitFor(() => {
      expect(screen.queryByTestId('lobster-avatar-inline-svg')).toBeNull()
    })
    expect(screen.getByAltText('Hidden stage')).toBeInTheDocument()
  })

  it('holds motion on a second mounted instance', async () => {
    const { rerender } = render(
      <>
        <LobsterAvatarFullBody src={testSrc} alt="First" />
      </>
    )

    await waitFor(() => {
      expect(screen.getByTestId('lobster-avatar-inline-svg')).toBeInTheDocument()
    })

    rerender(
      <>
        <LobsterAvatarFullBody src={testSrc} alt="First" />
        <LobsterAvatarFullBody src={testSrc} alt="Second" />
      </>
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('lobster-avatar-full-body')).toHaveLength(2)
    })
    expect(screen.getAllByTestId('lobster-avatar-inline-svg')).toHaveLength(1)
    expect(screen.getByAltText('Second')).toBeInTheDocument()
  })

  it('renders carapace silhouette with antennae when config and src are missing', () => {
    render(<LobsterAvatarFullBody />)
    expect(screen.getByTestId('lobster-avatar-silhouette')).toBeInTheDocument()
    expect(screen.queryByText(/No avatar/i)).toBeNull()
  })
})
