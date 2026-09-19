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

describe('SynapticOracleWidget', () => {
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
    expect(btn).toHaveAttribute('title', 'Open Oracle AI')
    expect(btn.parentElement).toHaveClass('right-6', 'bottom-4')
  })

  it('opens popout window on click and keeps it bottom-right', () => {
    const { container } = render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Open Oracle AI Popout/i }))

    expect(screen.getAllByText('SYNAPTIC ORACLE').length).toBeGreaterThan(0)
    expect(screen.queryByTitle(/Drag header to move chat window/i)).not.toBeInTheDocument()

    const popout = container.querySelector('.chamfer-corner')
    expect(popout).not.toBeNull()
    expect(popout).toHaveClass('right-6', 'bottom-4')
    expect(localStorage.getItem('moltology:oracle_button_pos')).toBeNull()
    expect(localStorage.getItem('moltology:oracle_popout_pos')).toBeNull()
  })

  it('opens popout on click even if the pointer moved during the press', () => {
    render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    const btn = screen.getByRole('button', { name: /Open Oracle AI Popout/i })
    fireEvent.pointerDown(btn, { clientX: 500, clientY: 500, pointerId: 1, button: 0 })
    fireEvent.pointerMove(btn, { clientX: 550, clientY: 550, pointerId: 1 })
    fireEvent.click(btn)

    expect(screen.getAllByText('SYNAPTIC ORACLE').length).toBeGreaterThan(0)
    expect(localStorage.getItem('moltology:oracle_button_pos')).toBeNull()
    expect(localStorage.getItem('moltology:oracle_popout_pos')).toBeNull()
  })

  it('clears leftover position keys on mount without writing new ones', () => {
    localStorage.setItem('moltology:oracle_button_pos', JSON.stringify({ x: 40, y: 80 }))
    localStorage.setItem('moltology:oracle_popout_pos', JSON.stringify({ x: 100, y: 120 }))

    render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    expect(localStorage.getItem('moltology:oracle_button_pos')).toBeNull()
    expect(localStorage.getItem('moltology:oracle_popout_pos')).toBeNull()
  })

  it('reopens the popout at the same bottom-right location after minimize', () => {
    vi.useFakeTimers()

    const { container } = render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Open Oracle AI Popout/i }))
    act(() => { vi.advanceTimersByTime(50) })

    const firstPopout = container.querySelector('.chamfer-corner')
    expect(firstPopout).toHaveClass('right-6', 'bottom-4')

    fireEvent.click(screen.getByTitle('Close Panel'))
    act(() => { vi.advanceTimersByTime(350) })

    fireEvent.click(screen.getByRole('button', { name: /Open Oracle AI Popout/i }))
    act(() => { vi.advanceTimersByTime(50) })

    const reopened = container.querySelector('.chamfer-corner')
    expect(reopened).toHaveClass('right-6', 'bottom-4')
    expect(localStorage.getItem('moltology:oracle_popout_pos')).toBeNull()

    vi.useRealTimers()
  })

  it('resizes the popout window from the interior edge and persists dimensions', () => {
    const { container } = render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Open Oracle AI Popout/i }))

    const nwHandle = container.querySelector('.cursor-nw-resize')
    expect(nwHandle).not.toBeNull()
    expect(container.querySelector('.cursor-se-resize')).toBeNull()
    expect(container.querySelector('.cursor-e-resize')).toBeNull()
    expect(container.querySelector('.cursor-s-resize')).toBeNull()

    // Drag the top-left corner left and up so the bottom-right anchor stays put
    fireEvent.pointerDown(nwHandle!, { clientX: 500, clientY: 500, pointerId: 3, button: 0 })
    fireEvent.pointerMove(nwHandle!, { clientX: 420, clientY: 400, pointerId: 3 })
    fireEvent.pointerUp(nwHandle!, { clientX: 420, clientY: 400, pointerId: 3 })

    const savedSize = localStorage.getItem('moltology:oracle_popout_size')
    expect(savedSize).not.toBeNull()
    const parsed = JSON.parse(savedSize!)
    expect(parsed.width).toBeGreaterThan(384)
    expect(parsed.height).toBeGreaterThan(640)
    expect(localStorage.getItem('moltology:oracle_popout_pos')).toBeNull()
  })

  it('resets window size when double clicking a window edge', () => {
    const { container } = render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Open Oracle AI Popout/i }))

    localStorage.setItem('moltology:oracle_popout_size', JSON.stringify({ width: 500, height: 600 }))
    localStorage.setItem('moltology:oracle_popout_pos', JSON.stringify({ x: 100, y: 100 }))

    const northHandle = container.querySelector('.cursor-n-resize')
    expect(northHandle).not.toBeNull()

    fireEvent.doubleClick(northHandle!)

    expect(localStorage.getItem('moltology:oracle_popout_size')).toBeNull()
    expect(localStorage.getItem('moltology:oracle_popout_pos')).toBeNull()
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
    expect(document.body.querySelector('.cursor-nw-resize')).toBeNull()
    expect(document.body.querySelector('.cursor-n-resize')).toBeNull()

    expect(screen.queryByTitle(/Drag header to move chat window/i)).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('renders Chats button in popout and toggles the chats list panel', () => {
    render(
      <OracleProvider>
        <SynapticOracleWidget />
      </OracleProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Open Oracle AI Popout/i }))

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

  it('resets popout size when switching from sidebar mode to small window (popout) mode', () => {
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

    localStorage.setItem(
      'moltology:oracle_popout_pos',
      JSON.stringify({ x: 120, y: 140 })
    )
    localStorage.setItem(
      'moltology:oracle_popout_size',
      JSON.stringify({ width: 550, height: 750 })
    )

    act(() => {
      contextModeSetter!('sidebar')
    })

    act(() => {
      contextModeSetter!('popout')
    })

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
