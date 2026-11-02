import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AvatarCreatorPanel } from './AvatarCreatorPanel'
import { LOBSTER_BACKGROUND_THEMES, type LobsterAvatarConfig } from '@/lib/lobster-avatar'

const initialConfig: LobsterAvatarConfig = {
  style: 'critters',
  seed: 'panel-test-seed',
  race: 'lobster',
  backgroundTheme: 'deep_abyss',
}

describe('AvatarCreatorPanel', () => {
  it('renders Backdrop theme swatches in scene tab and omits pattern options', () => {
    const onChange = vi.fn()
    render(<AvatarCreatorPanel value={initialConfig} onChange={onChange} section="scene" />)

    expect(screen.getByText('Backdrop')).toBeInTheDocument()
    expect(screen.queryByText('Backdrop pattern')).toBeNull()

    // All 12 background themes are rendered as swatches
    for (const theme of LOBSTER_BACKGROUND_THEMES) {
      expect(screen.getByRole('button', { name: theme.label })).toBeInTheDocument()
    }
  })

  it('calls onChange with updated backgroundTheme when a theme swatch is clicked', () => {
    const onChange = vi.fn()
    render(<AvatarCreatorPanel value={initialConfig} onChange={onChange} section="scene" />)

    const hydroCyanButton = screen.getByRole('button', { name: 'Hydro Cyan' })
    fireEvent.click(hydroCyanButton)

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundTheme: 'bio_cyan',
      })
    )
  })
})
