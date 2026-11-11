import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestStill3D = vi.hoisted(() => vi.fn())
vi.mock('@/lib/avatar3d-portrait-queue', () => ({ requestStill3D, readyStill3D: () => null }))

import { set3DSupportForTests } from '@/lib/avatar3d-support'
import { LobsterAvatarPortrait } from './LobsterAvatarPortrait'

const config = { style: 'critters', seed: 'portrait-test', race: 'crab' } as const

describe('LobsterAvatarPortrait', () => {
  beforeEach(() => {
    set3DSupportForTests(true)
    requestStill3D.mockReset()
  })

  it('shows a soft loader, then the 3D face, with the lens chrome', async () => {
    let finish: (url: string) => void = () => {}
    requestStill3D.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    render(<LobsterAvatarPortrait config={config} alt="Test Carapace" />)
    expect(screen.getByTestId('character-still-loading')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
    for (const id of ['portrait-lens-vignette', 'portrait-lens-sheen', 'portrait-lens-bezel', 'portrait-fisheye-dome', 'portrait-fisheye-chromatic']) {
      expect(screen.getByTestId(id)).toBeInTheDocument()
    }
    finish('data:image/webp;base64,FACE')
    await waitFor(() => expect(screen.getByAltText('Test Carapace')).toHaveAttribute('src', 'data:image/webp;base64,FACE'))
    expect(requestStill3D).toHaveBeenCalledWith(config, 256, 'portrait', expect.anything())
  })

  it('draws small portraits at 128 px', async () => {
    requestStill3D.mockResolvedValue('data:image/webp;base64,SMALL')
    render(<LobsterAvatarPortrait config={config} size={64} alt="Small" />)
    await waitFor(() => expect(screen.getByAltText('Small')).toBeInTheDocument())
    expect(requestStill3D.mock.calls[0][1]).toBe(128)
  })

  it('shows the plain dome when there is no character or no 3D', () => {
    render(<LobsterAvatarPortrait config={null} alt="Nobody" />)
    expect(screen.getByTestId('lobster-avatar-silhouette')).toBeInTheDocument()
    set3DSupportForTests(false)
    render(<LobsterAvatarPortrait config={config} alt="No 3D" />)
    expect(screen.getAllByTestId('lobster-avatar-silhouette')).toHaveLength(2)
    expect(requestStill3D).not.toHaveBeenCalled()
  })

  it('can drop each lens layer', () => {
    render(<LobsterAvatarPortrait config={null} fisheyeLens={false} vignette={false} specularSheen={false} />)
    expect(screen.queryByTestId('portrait-fisheye-dome')).toBeNull()
    expect(screen.queryByTestId('portrait-lens-vignette')).toBeNull()
    expect(screen.queryByTestId('portrait-lens-sheen')).toBeNull()
  })
})
