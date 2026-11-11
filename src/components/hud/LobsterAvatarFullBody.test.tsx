import React, { useEffect } from 'react'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const ready = vi.hoisted(() => ({ fire: () => {} }))
vi.mock('./avatar3d/Avatar3DStage', () => ({
  Avatar3DStage: ({ onReady, label }: { onReady?: () => void; label?: string }) => {
    useEffect(() => {
      ready.fire = () => onReady?.()
    }, [onReady])
    return <canvas data-testid="avatar-3d-stage" aria-label={label} />
  },
}))

import { set3DSupportForTests } from '@/lib/avatar3d-support'
import { LobsterAvatarFullBody } from './LobsterAvatarFullBody'

const config = { style: 'critters', seed: 'full-body-test', race: 'lobster', backgroundTheme: 'abyssal-cyan' } as never

describe('LobsterAvatarFullBody', () => {
  beforeEach(() => set3DSupportForTests(true))

  it('shows a spinner over the scene until the first 3D frame, then the character', () => {
    render(<LobsterAvatarFullBody config={config} alt="Me" />)
    const frame = screen.getByTestId('lobster-avatar-full-body')
    expect(frame).toHaveAttribute('data-state', 'loading')
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading Me')
    expect(screen.getByTestId('avatar-3d-stage')).toBeInTheDocument()
    act(() => ready.fire())
    expect(frame).toHaveAttribute('data-state', 'ready')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('never draws a 2D character: no character or no 3D shows the plain silhouette', () => {
    const { rerender } = render(<LobsterAvatarFullBody config={null} alt="Nobody" />)
    expect(screen.getByTestId('lobster-avatar-silhouette')).toBeInTheDocument()
    set3DSupportForTests(false)
    rerender(<LobsterAvatarFullBody config={config} alt="No 3D" />)
    expect(screen.getByTestId('lobster-avatar-full-body')).toHaveAttribute('data-state', 'placeholder')
    expect(screen.queryByTestId('avatar-3d-stage')).toBeNull()
  })

  it('offers Reset view while a gear slot is featured', () => {
    const reset = vi.fn()
    render(<LobsterAvatarFullBody config={config} focus="head" onResetFocus={reset} />)
    act(() => screen.getByRole('button', { name: /reset view/i }).click())
    expect(reset).toHaveBeenCalled()
  })
})
