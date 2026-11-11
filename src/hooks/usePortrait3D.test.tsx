import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const in3D = vi.hoisted(() => ({ value: true }))
const requestPortrait3D = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/useAvatar3D', () => ({ useAvatar3D: () => in3D.value }))
vi.mock('@/lib/avatar3d-portrait-queue', () => ({ requestPortrait3D }))

import { UserAvatar } from '@/components/UserAvatar'

const config = { seed: 'portrait-3d-test', race: 'crab' } as never

describe('usePortrait3D on the small avatar', () => {
  beforeEach(() => {
    in3D.value = true
    requestPortrait3D.mockReset()
  })

  it('swaps the 2D face for the 3D still once it is drawn', async () => {
    requestPortrait3D.mockResolvedValue('data:image/png;base64,3D')
    render(<UserAvatar config={config} alt="Me" />)
    await waitFor(() => expect(screen.getByAltText('Me').getAttribute('src')).toBe('data:image/png;base64,3D'))
    expect(requestPortrait3D).toHaveBeenCalledTimes(1)
  })

  it('keeps the 2D face when 3D cannot draw it', async () => {
    requestPortrait3D.mockResolvedValue(null)
    render(<UserAvatar config={config} alt="Me" />)
    await waitFor(() => expect(requestPortrait3D).toHaveBeenCalled())
    expect(screen.getByAltText('Me').getAttribute('src')).toMatch(/^data:image\/svg/)
  })

  it('never asks for a still when the viewer is not in 3D', () => {
    in3D.value = false
    render(<UserAvatar config={config} alt="Me" />)
    expect(requestPortrait3D).not.toHaveBeenCalled()
  })
})
