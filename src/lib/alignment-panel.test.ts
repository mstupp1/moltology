import { describe, it, expect, vi, afterEach } from 'vitest'
import { OPEN_ALIGNMENT_PANEL_EVENT, openAlignmentPanel, isAlignmentPanelHostVisible } from './alignment-panel'

describe('alignment panel glue', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('dispatches the open-alignment-panel event on the window', () => {
    const listener = vi.fn()
    window.addEventListener(OPEN_ALIGNMENT_PANEL_EVENT, listener)

    openAlignmentPanel()

    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener(OPEN_ALIGNMENT_PANEL_EVENT, listener)
  })

  it('treats a connected element as a visible panel host', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    expect(isAlignmentPanelHostVisible(host)).toBe(true)
    expect(isAlignmentPanelHostVisible(null)).toBe(false)

    document.body.removeChild(host)
  })

  it('rejects a host buried under display:none chrome', () => {
    const hidden = document.createElement('div')
    hidden.style.display = 'none'
    const host = document.createElement('div')
    hidden.appendChild(host)
    document.body.appendChild(hidden)

    expect(isAlignmentPanelHostVisible(host)).toBe(false)

    document.body.removeChild(hidden)
  })
})
