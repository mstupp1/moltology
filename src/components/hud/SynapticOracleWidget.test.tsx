import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SynapticOracleWidget } from './SynapticOracleWidget'
import { OracleProvider, useSafeOracle } from './OracleContext'
import { DEFAULT_ORACLE_PLACEHOLDER } from '@/lib/ai/oracle-models'

// Mock scrollIntoView for test environment
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock pointer capture methods
window.HTMLElement.prototype.setPointerCapture = vi.fn()
window.HTMLElement.prototype.releasePointerCapture = vi.fn()

// Mock TanStack router hooks
vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: '/dashboard' }),
  useNavigate: () => vi.fn(),
}))

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null, isPending: false }),
  },
}))

// Mock server API functions used by AIChatPanel
vi.mock('@/lib/server/api', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    getAIMessagesFn: vi.fn().mockResolvedValue([]),
    getAIThreadsFn: vi.fn().mockResolvedValue([]),
  }
})

vi.mock('@/lib/ai/stream-oracle-chat-client', () => ({
  streamOracleChat: vi.fn().mockResolvedValue({
    text: 'Oracle transmission response.',
    threadId: null,
    isGuest: true,
  }),
}))

describe('SynapticOracleWidget Drag & Resize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Set window dimensions
    window.innerWidth = 1200
    window.innerHeight = 800
  })

  it('renders the floating launcher button initially', () => {
    render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    const btn = screen.getByRole('button', { name: /Open Oracle AI Popout/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveTextContent(DEFAULT_ORACLE_PLACEHOLDER)
  })

  it('opens popout window on simple click (no drag)', () => {
    render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    const btn = screen.getByRole('button', { name: /Open Oracle AI Popout/i })

    // Simulate pointer down and pointer up with no movement
    fireEvent.pointerDown(btn, { clientX: 100, clientY: 100, pointerId: 1, button: 0 })
    fireEvent.pointerUp(btn, { clientX: 100, clientY: 100, pointerId: 1 })

    // Popout window should now be open
    expect(screen.getAllByText('SYNAPTIC ORACLE').length).toBeGreaterThan(0)
    expect(screen.getByTitle(/Drag header to move chat window/i)).toBeInTheDocument()
  })

  it('drags the floating button without opening popout if movement exceeds threshold', () => {
    render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    const btn = screen.getByRole('button', { name: /Open Oracle AI Popout/i })

    // Pointer down
    fireEvent.pointerDown(btn, { clientX: 500, clientY: 500, pointerId: 1, button: 0 })

    // Move pointer by 50px
    fireEvent.pointerMove(btn, { clientX: 550, clientY: 550, pointerId: 1 })

    // Pointer up
    fireEvent.pointerUp(btn, { clientX: 550, clientY: 550, pointerId: 1 })

    // Popout should NOT be open because it was a drag gesture
    expect(screen.queryByTitle('Drag header to move chat window')).not.toBeInTheDocument()

    // Position was saved to localStorage
    const savedPos = localStorage.getItem('moltology:oracle_button_pos')
    expect(savedPos).not.toBeNull()
  })

  it('drags the popout window via the header and preserves position across minimize and reopen', () => {
    vi.useFakeTimers()

    render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    // Open popout (advance past 20ms enter delay)
    const btn = screen.getByRole('button', { name: /Open Oracle AI Popout/i })
    fireEvent.pointerDown(btn, { clientX: 100, clientY: 100, pointerId: 1, button: 0 })
    fireEvent.pointerUp(btn, { clientX: 100, clientY: 100, pointerId: 1 })
    act(() => { vi.advanceTimersByTime(50) })

    const header = screen.getByTitle(/Drag header to move chat window/i)
    expect(header).toBeInTheDocument()

    // Drag header to (350, 180)
    fireEvent.pointerDown(header, { clientX: 400, clientY: 200, pointerId: 2, button: 0 })
    fireEvent.pointerMove(header, { clientX: 450, clientY: 230, pointerId: 2 })
    fireEvent.pointerUp(header, { clientX: 450, clientY: 230, pointerId: 2 })

    const savedPopoutPos = localStorage.getItem('moltology:oracle_popout_pos')
    expect(savedPopoutPos).not.toBeNull()
    const parsedPos = JSON.parse(savedPopoutPos!)

    // Minimize (close) popout window
    const closeBtn = screen.getByTitle('Close Panel')
    fireEvent.click(closeBtn)

    // Advance past exit animation (280ms) so isRendered → false and launcher button re-appears
    act(() => { vi.advanceTimersByTime(350) })

    // Popout should be closed
    expect(screen.queryByTitle('Drag header to move chat window')).not.toBeInTheDocument()

    // Reopen popout
    const reopenBtn = screen.getByRole('button', { name: /Open Oracle AI Popout/i })
    fireEvent.pointerDown(reopenBtn, { clientX: 100, clientY: 100, pointerId: 4, button: 0 })
    fireEvent.pointerUp(reopenBtn, { clientX: 100, clientY: 100, pointerId: 4 })
    act(() => { vi.advanceTimersByTime(50) })

    // Popout window should be open at the exact same saved position
    const reopenedHeader = screen.getByTitle(/Drag header to move chat window/i)
    expect(reopenedHeader).toBeInTheDocument()

    const currentSaved = localStorage.getItem('moltology:oracle_popout_pos')
    expect(JSON.parse(currentSaved!)).toEqual(parsedPos)

    vi.useRealTimers()
  })

  it('resizes the popout window and persists dimensions', () => {
    const { container } = render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    // Open popout
    const btn = screen.getByRole('button', { name: /Open Oracle AI Popout/i })
    fireEvent.pointerDown(btn, { clientX: 100, clientY: 100, pointerId: 1, button: 0 })
    fireEvent.pointerUp(btn, { clientX: 100, clientY: 100, pointerId: 1 })

    // Find bottom-right corner resize handle (cursor-se-resize)
    const seHandle = container.querySelector('.cursor-se-resize')
    expect(seHandle).not.toBeNull()

    // Start resize
    fireEvent.pointerDown(seHandle!, { clientX: 500, clientY: 500, pointerId: 3, button: 0 })
    fireEvent.pointerMove(seHandle!, { clientX: 580, clientY: 600, pointerId: 3 })
    fireEvent.pointerUp(seHandle!, { clientX: 580, clientY: 600, pointerId: 3 })

    const savedSize = localStorage.getItem('moltology:oracle_popout_size')
    expect(savedSize).not.toBeNull()
  })

  it('resets window position and size when double clicking window edge', () => {
    const { container } = render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    // Open popout
    const btn = screen.getByRole('button', { name: /Open Oracle AI Popout/i })
    fireEvent.pointerDown(btn, { clientX: 100, clientY: 100, pointerId: 1, button: 0 })
    fireEvent.pointerUp(btn, { clientX: 100, clientY: 100, pointerId: 1 })

    // Simulate saved values in localStorage
    localStorage.setItem('moltology:oracle_popout_pos', JSON.stringify({ x: 100, y: 100 }))
    localStorage.setItem('moltology:oracle_popout_size', JSON.stringify({ width: 500, height: 600 }))

    const northHandle = container.querySelector('.cursor-n-resize')
    expect(northHandle).not.toBeNull()

    fireEvent.doubleClick(northHandle!)

    expect(localStorage.getItem('moltology:oracle_popout_pos')).toBeNull()
    expect(localStorage.getItem('moltology:oracle_popout_size')).toBeNull()
  })

  it('docks to bottom as interactive prompt pill tray with no resize handles on mobile viewport', () => {
    window.innerWidth = 375
    window.innerHeight = 667

    vi.useFakeTimers()

    render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    // Mobile prompt pill dock should be rendered with prompt text
    const btn = screen.getByRole('button', { name: /Open Oracle AI Tray/i })
    expect(btn).toBeInTheDocument()
    expect(screen.getByText(/Ask Synaptic Oracle.../i)).toBeInTheDocument()

    // Tap to open tray
    fireEvent.click(btn)
    act(() => { vi.advanceTimersByTime(50) })

    // Mobile sheet is rendered via HudBottomSheet into document.body
    const mobileSheet = document.body.querySelector('[role="dialog"][aria-label="Synaptic Oracle AI Assistant"]')
    expect(mobileSheet).not.toBeNull()
    expect(screen.getByLabelText('Drag handle to close')).toBeInTheDocument()

    // Resize handles should NOT exist anywhere (neither in container nor body)
    expect(document.body.querySelector('.cursor-se-resize')).toBeNull()
    expect(document.body.querySelector('.cursor-n-resize')).toBeNull()

    // Header drag title should not be present on mobile
    expect(screen.queryByTitle(/Drag header to move chat window/i)).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('renders Chats button in popout and toggles the chats list panel', () => {
    render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    // Open popout
    const btn = screen.getByRole('button', { name: /Open Oracle AI Popout/i })
    fireEvent.pointerDown(btn, { clientX: 100, clientY: 100, pointerId: 1, button: 0 })
    fireEvent.pointerUp(btn, { clientX: 100, clientY: 100, pointerId: 1 })

    // Find and click Chats button
    const chatsBtn = screen.getByRole('button', { name: /Toggle Chats/i })
    expect(chatsBtn).toBeInTheDocument()
    fireEvent.click(chatsBtn)

    const panel = screen.getByTestId('oracle-chats-panel')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveAttribute('data-chats-layout', 'takeover')
    expect(screen.getByText('CHATS')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Close Chats$/i }))
    expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
    expect(screen.queryByText('CHATS')).not.toBeInTheDocument()
  })

  it('resets popout position and size when switching from sidebar mode to small window (popout) mode', () => {
    let contextModeSetter: ((mode: any) => void) | null = null

    function TestController() {
      const oracle = useSafeOracle()
      if (oracle) {
        contextModeSetter = oracle.setMode
      }
      return <SynapticOracleWidget />
    }

    render(
      <OracleProvider>
        <TestController />
      </OracleProvider>
    )

    // Save custom popout size and position
    localStorage.setItem(
      'moltology:oracle_popout_pos',
      JSON.stringify({ x: 120, y: 140 })
    )
    localStorage.setItem(
      'moltology:oracle_popout_size',
      JSON.stringify({ width: 550, height: 750 })
    )

    // Switch to sidebar mode
    act(() => {
      contextModeSetter!('sidebar')
    })

    // Switch from sidebar mode to popout mode (or close)
    act(() => {
      contextModeSetter!('popout')
    })

    // localStorage keys should be cleared — positions are held in memory at default values
    expect(localStorage.getItem('moltology:oracle_popout_size')).toBeNull()
    expect(localStorage.getItem('moltology:oracle_popout_pos')).toBeNull()
    expect(localStorage.getItem('moltology:oracle_button_pos')).toBeNull()
  })

  it('supports mobile swipe-up to open and swipe-down handle gesture to dismiss tray', () => {
    window.innerWidth = 375
    window.innerHeight = 667

    vi.useFakeTimers()

    render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    const pillBtn = screen.getByRole('button', { name: /Open Oracle AI Tray/i })
    expect(pillBtn).toBeInTheDocument()

    // Simulate swipe up by 30px (touchStartY: 600, changedTouches clientY: 570)
    fireEvent.touchStart(pillBtn, {
      touches: [{ clientY: 600 }],
    })
    fireEvent.touchEnd(pillBtn, {
      changedTouches: [{ clientY: 570 }],
    })

    act(() => { vi.advanceTimersByTime(50) })

    // Tray is now open
    const handle = screen.getByLabelText('Drag handle to close')
    expect(handle).toBeInTheDocument()

    // Swipe down on the handle past threshold (50px to 180px, delta = 130px)
    fireEvent.touchStart(handle, {
      touches: [{ clientY: 50 }],
    })
    fireEvent.touchMove(handle, {
      touches: [{ clientY: 180 }],
    })
    fireEvent.touchEnd(handle)

    // Advance past exit animation
    act(() => { vi.advanceTimersByTime(350) })

    // Mobile prompt pill dock should re-appear
    expect(screen.getByRole('button', { name: /Open Oracle AI Tray/i })).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('renders realistic thin and tall blinking caret cursors with shared pill styling', () => {
    render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    const cursors = screen.getAllByTestId('oracle-caret-cursor')
    expect(cursors.length).toBeGreaterThan(0)
    for (const cursor of cursors) {
      expect(cursor).toHaveClass('animate-caret-blink')
      expect(cursor).toHaveClass('w-[1.5px]')
      expect(cursor).toHaveClass('h-3.5')
      expect(cursor).toHaveClass('bg-[#00c3ff]')
    }
  })
})

