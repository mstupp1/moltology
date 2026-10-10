import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { toOptimizedWebp, WEB_IMAGE_MAX_EDGE } from './optimize-image'

describe('toOptimizedWebp', () => {
  it('converts to webp and caps the longest edge', async () => {
    const png = await sharp({
      create: { width: 3000, height: 1500, channels: 4, background: { r: 10, g: 80, b: 120, alpha: 0.5 } },
    })
      .png()
      .toBuffer()

    const out = await toOptimizedWebp(png)
    const meta = await sharp(out).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.width).toBe(WEB_IMAGE_MAX_EDGE)
    expect(meta.height).toBe(WEB_IMAGE_MAX_EDGE / 2)
    expect(meta.hasAlpha).toBe(true)
  })

  it('does not enlarge small images', async () => {
    const jpg = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#335' } })
      .jpeg()
      .toBuffer()
    const meta = await sharp(await toOptimizedWebp(jpg)).metadata()
    expect([meta.width, meta.height]).toEqual([400, 300])
  })
})
