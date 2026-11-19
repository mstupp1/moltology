import { describe, expect, it } from 'vitest'
import { artPrompt, keyOut, loadArtSpec, makeSeamless, slotsOf } from './set-art'
import { SET_NAMES } from '../../../src/lib/avatar3d/sets'

function solid(w: number, h: number, rgb: number[]) {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let p = 0; p < w * h; p++) data.set([...rgb, 255], p * 4)
  return data
}

describe('set art', () => {
  it('has a plate prompt for every set and frames each prompt with the house style', () => {
    const spec = loadArtSpec()
    for (const set of SET_NAMES) {
      expect(slotsOf(spec, set)).toContain('plate')
      expect(artPrompt(spec, set, 'plate')).toContain('No characters')
    }
    expect(artPrompt(spec, 'codex-study', 'back')).toContain('#FF00FF')
  })

  it('keys out a magenta background and keeps the scenery', () => {
    const data = solid(8, 8, [255, 0, 255])
    data.set([60, 40, 20, 255], (3 * 8 + 3) * 4)
    expect(keyOut(data, 8, 8)).toBe(true)
    expect(data[3]).toBe(0)
    expect(data[(3 * 8 + 3) * 4 + 3]).toBe(255)
  })

  it('leaves images that already have transparency alone', () => {
    const data = solid(4, 4, [255, 0, 255])
    data[3] = 0
    expect(keyOut(data, 4, 4)).toBe(false)
  })

  it('makes opposite edges of a texture match', () => {
    const w = 16
    const data = new Uint8ClampedArray(w * w * 4)
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) data.set([x * 16, y * 16, 0, 255], (y * w + x) * 4)
    const out = makeSeamless(data, w, w)
    for (let y = 0; y < w; y++) {
      const left = out[(y * w) * 4]
      const right = out[(y * w + w - 1) * 4]
      expect(Math.abs(left - right)).toBeLessThanOrEqual(16)
    }
  })
})
