import { DataUtils } from 'three'
import { describe, expect, it } from 'vitest'
import { packSlopes } from './textures'

/** A square RGBA tile (top row first) from a height function of column and row. */
function tile(size: number, h: (x: number, y: number) => number): Uint8Array {
  const out = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const v = Math.round(h(x, y) * 255)
      out.set([v, v, v, 255], (y * size + x) * 4)
    }
  return out
}

const at = (data: Uint16Array, size: number, x: number, y: number, c: number) => DataUtils.fromHalfFloat(data[(y * size + x) * 4 + c])

describe('packSlopes', () => {
  it('stores height and its slope per tile, with rows bottom first', () => {
    const size = 16
    // Height rises along x and, in the image, falls toward the bottom rows.
    const t = packSlopes(tile(size, (x, y) => 0.2 + 0.03 * x + 0.01 * (size - 1 - y)), size)
    const data = t.image.data as Uint16Array
    // Bottom image row comes first, so row 0 here is the image's last row.
    expect(at(data, size, 5, 0, 0)).toBeCloseTo(Math.round((0.2 + 0.15) * 255) / 255, 2)
    // Away from the wrap-around edges: 0.03 per texel across, 16 texels per tile.
    expect(at(data, size, 5, 5, 1)).toBeCloseTo(0.03 * size, 1)
    expect(at(data, size, 5, 5, 2)).toBeCloseTo(0.01 * size, 1)
    expect(t.userData.sloped).toBe(true)
  })

  it('builds a full mip chain whose slopes soften with distance', () => {
    const size = 32
    const t = packSlopes(tile(size, (x, y) => ((x + y) % 2 ? 1 : 0)), size)
    expect(t.mipmaps.map((m) => (m as unknown as { width: number }).width)).toEqual([32, 16, 8, 4, 2, 1])
    const level = (i: number) => (t.mipmaps[i] as unknown as { data: Uint16Array }).data
    // A texel-sharp checker blurs to flat mid grey one level down: no bump left to sparkle.
    expect(Math.abs(at(level(1), 16, 3, 3, 1))).toBeLessThan(1e-3)
    expect(at(level(1), 16, 3, 3, 0)).toBeCloseTo(0.5, 2)
  })
})
