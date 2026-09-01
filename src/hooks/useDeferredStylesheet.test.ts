import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDeferredStylesheet } from './useDeferredStylesheet'

describe('useDeferredStylesheet', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('loads the stylesheet immediately under Vitest', async () => {
    const loader = vi.fn(() => Promise.resolve())

    renderHook(() => useDeferredStylesheet(loader))

    await waitFor(() => {
      expect(loader).toHaveBeenCalledTimes(1)
    })
  })
})
