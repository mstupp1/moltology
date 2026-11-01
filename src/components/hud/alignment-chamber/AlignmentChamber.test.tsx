import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { AlignmentChamber } from './AlignmentChamber'
import { CHAMBER_SOCKETS } from './layout'
import { mergeCompletions, TOTAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'
import { setHeavyVfxDisabled } from '@/lib/vfx-settings'

let reduced = false
let motionChange: (() => void) | undefined
let visibility: ((entries: { isIntersecting: boolean }[]) => void) | undefined

beforeEach(() => {
  reduced = false
  motionChange = undefined
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    get matches() { return reduced },
    addEventListener: (_: string, callback: () => void) => { motionChange = callback },
    removeEventListener: vi.fn(),
  })))
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: typeof visibility) { visibility = callback }
    observe() { visibility?.([{ isIntersecting: true }]) }
    disconnect() {}
  })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('Image-based alignment chamber', () => {
  it('has eight image anchors in four mirrored pairs', () => {
    expect(CHAMBER_SOCKETS).toHaveLength(TOTAL_ALIGNMENT_TASKS)
    expect(CHAMBER_SOCKETS.filter(({ x }) => x < 50)).toHaveLength(4)
    CHAMBER_SOCKETS.forEach((socket, index) => {
      const mirror = CHAMBER_SOCKETS[TOTAL_ALIGNMENT_TASKS - index - 1]
      expect(socket.x + mirror.x).toBeCloseTo(100)
      expect(socket.y).toBe(mirror.y)
    })
  })

  it('shows flames for individual completed tasks and removes them on undo', () => {
    const { container, rerender } = render(<AlignmentChamber tasks={mergeCompletions(['silent-synchronization', 'reflection-log'])} />)
    expect(screen.getByRole('img')).toHaveAccessibleName('Alignment chamber: 2 of 8 ritual flames lit.')
    expect(container.querySelectorAll('[data-socket]')).toHaveLength(8)
    expect(container.querySelectorAll('.alignment-chamber-flame')).toHaveLength(2)
    expect(container.querySelector('[data-socket="reflection-log"] .alignment-chamber-flame')).not.toBeNull()
    expect(container.querySelector('canvas')).toBeNull()
    expect(container.querySelector('img')).toHaveAttribute('src', '/media/images/hud/alignment/chamber-v1.webp')
    rerender(<AlignmentChamber tasks={mergeCompletions(['reflection-log'])} />)
    expect(container.querySelectorAll('.alignment-chamber-flame')).toHaveLength(1)
    expect(container.querySelector('[data-socket="silent-synchronization"] .alignment-chamber-flame')).toBeNull()
  })

  it('keeps every socket on its own animation phase when tasks are toggled', () => {
    const allTasks = mergeCompletions().map((task) => ({ ...task, completed: true }))
    const { container, rerender } = render(<AlignmentChamber tasks={allTasks} />)
    const delays = () => Array.from(container.querySelectorAll<HTMLElement>('.alignment-chamber-flame'),
      (flame) => flame.style.getPropertyValue('--flame-delay'))
    const initialDelays = delays()
    expect(new Set(initialDelays).size).toBe(TOTAL_ALIGNMENT_TASKS)
    expect(initialDelays.every((delay) => Number.parseFloat(delay) <= 0 && Number.parseFloat(delay) > -3.6)).toBe(true)
    rerender(<AlignmentChamber tasks={allTasks.map((task, index) => ({ ...task, completed: index !== 0 }))} />)
    expect(delays()).toEqual(initialDelays.slice(1))
  })

  it('retains static flame images when the existing heavy effects preference is disabled', () => {
    setHeavyVfxDisabled(true)
    const { container } = render(<AlignmentChamber tasks={mergeCompletions(['skill-development'])} />)
    expect(container.firstChild).toHaveAttribute('data-motion', 'static')
    expect(container.querySelectorAll('.alignment-chamber-flame')).toHaveLength(1)
    act(() => setHeavyVfxDisabled(false))
    expect(container.firstChild).toHaveAttribute('data-motion', 'animated')
    act(() => setHeavyVfxDisabled(true))
    expect(container.firstChild).toHaveAttribute('data-motion', 'static')
  })

  it('honors reduced motion on initial load and live changes', () => {
    reduced = true
    const { container } = render(<AlignmentChamber tasks={mergeCompletions()} />)
    expect(container.firstChild).toHaveAttribute('data-motion', 'static')
    act(() => { reduced = false; motionChange?.() })
    expect(container.firstChild).toHaveAttribute('data-motion', 'animated')
    act(() => { reduced = true; motionChange?.() })
    expect(container.firstChild).toHaveAttribute('data-motion', 'static')
  })

  it('stops loops offscreen and in hidden tabs', () => {
    const { container } = render(<AlignmentChamber tasks={mergeCompletions()} />)
    act(() => visibility?.([{ isIntersecting: false }]))
    expect(container.firstChild).toHaveAttribute('data-motion', 'static')
    act(() => visibility?.([{ isIntersecting: true }]))
    expect(container.firstChild).toHaveAttribute('data-motion', 'animated')
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    fireEvent(document, new Event('visibilitychange'))
    expect(container.firstChild).toHaveAttribute('data-motion', 'static')
  })
})
