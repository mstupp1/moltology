import { act, renderHook } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { mark3DUnavailable, set3DSupportForTests } from '@/lib/avatar3d-support'
import { useAvatar3D } from './useAvatar3D'

describe('useAvatar3D', () => {
  it('is on for everyone whose browser can draw 3D, with no account check', () => {
    set3DSupportForTests(true)
    const { result } = renderHook(() => useAvatar3D())
    expect(result.current).toBe(true)
  })

  it('turns off for the whole page once 3D fails', () => {
    set3DSupportForTests(true)
    const { result } = renderHook(() => useAvatar3D())
    act(() => mark3DUnavailable())
    expect(result.current).toBe(false)
  })

  it('is unknown on the server, so the page renders a loader rather than a guess', () => {
    function Probe() {
      return <span>{String(useAvatar3D())}</span>
    }
    expect(renderToString(<Probe />)).toContain('null')
  })
})
