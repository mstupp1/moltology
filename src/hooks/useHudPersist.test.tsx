import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HudPersistProvider, useHudPersist } from './useHudPersist'

function wrapper({ children }: { children: React.ReactNode }) {
  return <HudPersistProvider>{children}</HudPersistProvider>
}

describe('useHudPersist', () => {
  it('starts idle outside and inside the provider', () => {
    const { result: outside } = renderHook(() => useHudPersist())
    expect(outside.current.isPersisting).toBe(false)

    const { result } = renderHook(() => useHudPersist(), { wrapper })
    expect(result.current.isPersisting).toBe(false)
  })

  it('refcounts begin/end so overlapping keys stay active', () => {
    const { result } = renderHook(() => useHudPersist(), { wrapper })

    act(() => {
      result.current.begin('a')
      result.current.begin('a')
      result.current.begin('b')
    })
    expect(result.current.isPersisting).toBe(true)

    act(() => {
      result.current.end('a')
    })
    expect(result.current.isPersisting).toBe(true)

    act(() => {
      result.current.end('a')
      result.current.end('b')
    })
    expect(result.current.isPersisting).toBe(false)
  })

  it('run wraps work with begin/end even when the promise rejects', async () => {
    const { result } = renderHook(() => useHudPersist(), { wrapper })

    await act(async () => {
      try {
        await result.current.run('job', async () => {
          throw new Error('boom')
        })
      } catch (err) {
        expect(err).toBeInstanceOf(Error)
        expect((err as Error).message).toBe('boom')
      }
    })

    expect(result.current.isPersisting).toBe(false)
  })

  it('run resolves with the work result and clears persist state', async () => {
    const { result } = renderHook(() => useHudPersist(), { wrapper })

    let value = ''
    await act(async () => {
      value = await result.current.run('job', async () => 'ok')
    })

    expect(value).toBe('ok')
    expect(result.current.isPersisting).toBe(false)
  })

  it('no-ops begin/end outside a provider without throwing', () => {
    const { result } = renderHook(() => useHudPersist())
    act(() => {
      result.current.begin('x')
      result.current.end('x')
    })
    expect(result.current.isPersisting).toBe(false)
  })
})
