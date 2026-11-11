import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestStill3D = vi.hoisted(() => vi.fn())
vi.mock('@/lib/avatar3d-portrait-queue', () => ({ requestStill3D, readyStill3D: () => null }))

import { set3DSupportForTests } from '@/lib/avatar3d-support'
import { UserAvatar } from '@/components/UserAvatar'

const config = { seed: 'portrait-3d-test', race: 'crab' } as never

describe('3D stills on the small avatar', () => {
  beforeEach(() => {
    set3DSupportForTests(true)
    requestStill3D.mockReset()
  })

  it('shows the 3D face once it is drawn, and never a 2D one', async () => {
    requestStill3D.mockResolvedValue('data:image/webp;base64,3D')
    render(<UserAvatar config={config} alt="Me" />)
    expect(screen.getByTestId('character-still-loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByAltText('Me').getAttribute('src')).toBe('data:image/webp;base64,3D'))
    expect(requestStill3D).toHaveBeenCalledTimes(1)
  })

  it('keeps the loader while 3D has not drawn the face', async () => {
    requestStill3D.mockResolvedValue(null)
    render(<UserAvatar config={config} alt="Me" />)
    await waitFor(() => expect(requestStill3D).toHaveBeenCalled())
    expect(screen.queryByAltText('Me')).toBeNull()
    expect(screen.getByTestId('character-still-loading')).toBeInTheDocument()
  })

  it('never asks for a still when the browser cannot draw 3D', () => {
    set3DSupportForTests(false)
    render(<UserAvatar config={config} alt="Me" />)
    expect(requestStill3D).not.toHaveBeenCalled()
    expect(screen.getByTestId('lobster-avatar-silhouette')).toBeInTheDocument()
  })
})
