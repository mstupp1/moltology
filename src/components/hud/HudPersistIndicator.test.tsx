import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HudPersistProvider, useHudPersist } from '@/hooks/useHudPersist'
import { HudPersistIndicator } from './HudPersistIndicator'

function PersistControls() {
  const persist = useHudPersist()
  return (
    <button type="button" onClick={() => persist.begin('test')}>
      begin
    </button>
  )
}

describe('HudPersistIndicator', () => {
  it('is absent while idle and renders spinner when persisting', () => {
    render(
      <HudPersistProvider>
        <div className="relative">
          <HudPersistIndicator />
          <PersistControls />
        </div>
      </HudPersistProvider>
    )

    expect(screen.queryByTestId('hud-persist-indicator')).not.toBeInTheDocument()

    act(() => {
      screen.getByRole('button', { name: 'begin' }).click()
    })

    const indicator = screen.getByTestId('hud-persist-indicator')
    expect(indicator).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Saving' })).toBeInTheDocument()
  })
})
