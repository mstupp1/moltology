import { describe, expect, it } from 'vitest'
import { startHeroWater, WATER_FRAGMENT } from './water'

describe('startHeroWater', () => {
  it('returns null without WebGL, so the CSS sea stays', () => {
    const el = () => document.createElement('div')
    const canvas = document.createElement('canvas')
    canvas.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']
    expect(startHeroWater({ canvas, source: document.createElement('canvas'), sea: el(), host: el(), anchor: el() })).toBeNull()
  })

  it('keeps the shader on WebGL 1 syntax', () => {
    expect(WATER_FRAGMENT).toContain('gl_FragColor')
    expect(WATER_FRAGMENT).not.toMatch(/#version|texture\(|out vec4/)
  })
})
