import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import {
  ORACLE_CORE_INTRO_DELAY_MS,
  ORACLE_CORE_INTRO_KEY,
  markOracleCoreIntroSeen,
  resetOracleCoreIntroForTests,
  setOracleCoreIntroBlocked,
  useOracleCoreIntro,
} from './oracle-core-intro'
import { HUDMobileTabBar } from '@/components/hud/HUDMobileTabBar'
import { LayoutDashboard } from 'lucide-react'

function Probe({ enabled = true }: { enabled?: boolean }) {
  const show = useOracleCoreIntro(enabled)
  return <div data-testid="probe">{show ? 'shown' : 'hidden'}</div>
}

const probe = () => screen.getByTestId('probe').textContent

describe('Oracle core first-visit tip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    resetOracleCoreIntroForTests()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('appears after a short pause on a fresh device', () => {
    render(<Probe />)
    expect(probe()).toBe('hidden')
    act(() => vi.advanceTimersByTime(ORACLE_CORE_INTRO_DELAY_MS))
    expect(probe()).toBe('shown')
  })

  it('never appears once this device has opened the Oracle', () => {
    localStorage.setItem(ORACLE_CORE_INTRO_KEY, '1')
    resetOracleCoreIntroForTests()
    render(<Probe />)
    act(() => vi.advanceTimersByTime(ORACLE_CORE_INTRO_DELAY_MS * 2))
    expect(probe()).toBe('hidden')
  })

  it('goes away for good when marked seen', () => {
    render(<Probe />)
    act(() => vi.advanceTimersByTime(ORACLE_CORE_INTRO_DELAY_MS))
    act(() => markOracleCoreIntroSeen())
    expect(probe()).toBe('hidden')
    expect(localStorage.getItem(ORACLE_CORE_INTRO_KEY)).toBe('1')
  })

  it('waits while the welcome flow is open, then restarts its pause', () => {
    act(() => setOracleCoreIntroBlocked(true))
    render(<Probe />)
    act(() => vi.advanceTimersByTime(ORACLE_CORE_INTRO_DELAY_MS * 3))
    expect(probe()).toBe('hidden')
    act(() => setOracleCoreIntroBlocked(false))
    expect(probe()).toBe('hidden')
    act(() => vi.advanceTimersByTime(ORACLE_CORE_INTRO_DELAY_MS))
    expect(probe()).toBe('shown')
  })

  it('stays hidden while its core is busy', () => {
    render(<Probe enabled={false} />)
    act(() => vi.advanceTimersByTime(ORACLE_CORE_INTRO_DELAY_MS * 2))
    expect(probe()).toBe('hidden')
  })

  describe('phone bottom bar', () => {
    const tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'forum', label: 'Forum', icon: LayoutDashboard, path: '/forum' },
    ]
    const renderBar = (onPress = vi.fn(), current = false, moreOpen = false) =>
      render(
        <HUDMobileTabBar
          tabs={tabs}
          activeId="dashboard"
          moreOpen={moreOpen}
          onNavigate={vi.fn()}
          onToggleMore={vi.fn()}
          core={{ current, onPress }}
        />,
      )

    it('points at the core and lights its beacon', () => {
      renderBar()
      act(() => vi.advanceTimersByTime(ORACLE_CORE_INTRO_DELAY_MS))
      expect(screen.getByTestId('oracle-core-tip')).toHaveAttribute('data-placement', 'above')
      expect(screen.getByTestId('oracle-core-glyph')).toHaveAttribute('data-beacon', 'true')
    })

    it('opens the Oracle from the tip text', () => {
      const onPress = vi.fn()
      renderBar(onPress)
      act(() => vi.advanceTimersByTime(ORACLE_CORE_INTRO_DELAY_MS))
      fireEvent.click(screen.getByRole('button', { name: 'Ask the Oracle anything' }))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('dismisses for good from the X', () => {
      renderBar()
      act(() => vi.advanceTimersByTime(ORACLE_CORE_INTRO_DELAY_MS))
      fireEvent.click(screen.getByTestId('oracle-core-tip-dismiss'))
      expect(screen.queryByTestId('oracle-core-tip')).toBeNull()
      expect(screen.getByTestId('oracle-core-glyph')).not.toHaveAttribute('data-beacon')
      expect(localStorage.getItem(ORACLE_CORE_INTRO_KEY)).toBe('1')
    })

    it('holds back while the More sheet is open', () => {
      renderBar(vi.fn(), false, true)
      act(() => vi.advanceTimersByTime(ORACLE_CORE_INTRO_DELAY_MS * 2))
      expect(screen.queryByTestId('oracle-core-tip')).toBeNull()
    })
  })
})
