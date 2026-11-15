import { describe, it, expect } from 'vitest'
import { computeKeyboardInset, panelKeyboardInset } from './useChatViewport'

describe('computeKeyboardInset', () => {
  it('returns the covered height when a keyboard is open', () => {
    // iPhone: 844 layout, keyboard leaves 508 visible, not panned.
    expect(computeKeyboardInset(844, 508, 0)).toBe(336)
  })

  it('accounts for Safari panning the visual viewport', () => {
    expect(computeKeyboardInset(844, 508, 120)).toBe(216)
  })

  it('ignores small changes like the URL bar collapsing', () => {
    expect(computeKeyboardInset(844, 790, 0)).toBe(0)
  })

  it('is zero when the layout already shrank for the keyboard (Android resize)', () => {
    expect(computeKeyboardInset(508, 508, 0)).toBe(0)
  })
})

describe('panelKeyboardInset', () => {
  it('subtracts the space below the panel, like the phone tab bar', () => {
    // Keyboard covers 336px; the panel ends 56 + 24px above the bottom.
    expect(panelKeyboardInset(336, 80)).toBe(256)
  })

  it('pads by the full inset when the panel reaches the bottom', () => {
    expect(panelKeyboardInset(336, 0)).toBe(336)
  })

  it('is zero without a keyboard or when the keyboard stays below the panel', () => {
    expect(panelKeyboardInset(0, 80)).toBe(0)
    expect(panelKeyboardInset(60, 80)).toBe(0)
  })
})
