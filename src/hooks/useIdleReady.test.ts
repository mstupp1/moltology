import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIdleReady } from './useIdleReady'

describe('useIdleReady', () => {
  it('is immediately ready under Vitest', () => {
    const { result } = renderHook(() => useIdleReady())
    expect(result.current).toBe(true)
  })
})
