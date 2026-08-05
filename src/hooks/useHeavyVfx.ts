import { useState, useEffect, useCallback } from 'react'
import {
  isHeavyVfxDisabled,
  setHeavyVfxDisabled,
  toggleHeavyVfx,
  HEAVY_VFX_CHANGE_EVENT,
  HEAVY_VFX_STORAGE_KEY,
} from '@/lib/vfx-settings'

/**
 * Custom React hook for subscribing to & toggling Heavy Portal Visual FX state.
 */
export function useHeavyVfx() {
  const [heavyVfxDisabled, setDisabledState] = useState<boolean>(false)

  useEffect(() => {
    // Sync with localStorage on client post-hydration
    setDisabledState(isHeavyVfxDisabled())

    const handleCustomEvent = (e: Event) => {
      const customEvt = e as CustomEvent<{ disabled: boolean }>
      if (customEvt.detail && typeof customEvt.detail.disabled === 'boolean') {
        setDisabledState(customEvt.detail.disabled)
      } else {
        setDisabledState(isHeavyVfxDisabled())
      }
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === HEAVY_VFX_STORAGE_KEY) {
        setDisabledState(isHeavyVfxDisabled())
      }
    }

    window.addEventListener(HEAVY_VFX_CHANGE_EVENT, handleCustomEvent)
    window.addEventListener('storage', handleStorageEvent)

    return () => {
      window.removeEventListener(HEAVY_VFX_CHANGE_EVENT, handleCustomEvent)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [])

  const setDisabled = useCallback((val: boolean) => {
    setHeavyVfxDisabled(val)
  }, [])

  const toggle = useCallback(() => {
    toggleHeavyVfx()
  }, [])

  return {
    heavyVfxDisabled,
    setHeavyVfxDisabled: setDisabled,
    toggleHeavyVfx: toggle,
  }
}
