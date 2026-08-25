import React from 'react'
import { HUDSpinner } from '@/components/ui'
import { useHudPersist } from '@/hooks/useHudPersist'

/**
 * Ambient shell spinner for in-flight optimistic HUD persists.
 * Mount once in HudLayout; driven by useHudPersist begin/end/run.
 */
export function HudPersistIndicator() {
  const { isPersisting } = useHudPersist()

  if (!isPersisting) return null

  return (
    <div
      className="absolute bottom-3 left-3 z-40 pointer-events-none pb-[max(0px,env(safe-area-inset-bottom))]"
      data-testid="hud-persist-indicator"
    >
      <HUDSpinner size="sm" variant="cyan" aria-label="Saving" />
    </div>
  )
}
