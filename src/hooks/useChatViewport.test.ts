import { describe, it, expect } from 'vitest'
import { computeKeyboardInset } from './useChatViewport'

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
