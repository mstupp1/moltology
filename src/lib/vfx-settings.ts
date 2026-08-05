/**
 * Utility module for managing Portal Heavy VFX (Visual Effects) preferences.
 */

export const HEAVY_VFX_STORAGE_KEY = 'moltology_heavy_vfx_disabled'
export const HEAVY_VFX_CHANGE_EVENT = 'moltology:heavy-vfx-change'

/**
 * Checks if Heavy Portal VFX are currently disabled in localStorage.
 */
export function isHeavyVfxDisabled(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false
  }
  return localStorage.getItem(HEAVY_VFX_STORAGE_KEY) === 'true'
}

/**
 * Sets the Heavy Portal VFX disabled preference and dispatches a change event.
 */
export function setHeavyVfxDisabled(disabled: boolean): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  localStorage.setItem(HEAVY_VFX_STORAGE_KEY, String(disabled))
  window.dispatchEvent(
    new CustomEvent(HEAVY_VFX_CHANGE_EVENT, { detail: { disabled } })
  )
}

/**
 * Toggles the Heavy Portal VFX disabled preference.
 */
export function toggleHeavyVfx(): boolean {
  const current = isHeavyVfxDisabled()
  const next = !current
  setHeavyVfxDisabled(next)
  return next
}
