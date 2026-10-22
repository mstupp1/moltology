import { afterEach, describe, expect, it } from 'vitest'
import { isBackdropCovered } from './useBackdropCovered'

describe('isBackdropCovered', () => {
  afterEach(() => {
    document.body.style.overflow = ''
    document.body.innerHTML = ''
  })

  it('is false on a plain page', () => {
    expect(isBackdropCovered()).toBe(false)
  })

  it('is true while a sheet or menu has locked body scroll', () => {
    document.body.style.overflow = 'hidden'
    expect(isBackdropCovered()).toBe(true)
  })

  it('is true while an aria-modal dialog is open', () => {
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    document.body.appendChild(dialog)
    expect(isBackdropCovered()).toBe(true)
  })
})
