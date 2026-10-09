import { describe, expect, it } from 'vitest'
import { encodeIco, makePalettes, parsePart } from './build-brand-assets.mjs'

describe('brand asset generation', () => {
  it('uses application tokens and keeps reference, pure mono and inherited palettes distinct', () => {
    const palettes = makePalettes({ crimson: { aggro: '#ff453a' }, ink: { DEFAULT: '#e4e9e9' }, cyan: { glow: '#00c3ff', muted: '#006080' }, benthic: { surface: '#0f1414' } })
    expect(palettes.dark.icon).toBe('#ff453a')
    expect(palettes['reference-dark'].icon).toBe('#ef174c')
    expect(Object.values(palettes.black)).toEqual(['#000000', '#000000', '#000000'])
    expect(Object.values(palettes.white)).toEqual(['#ffffff', '#ffffff', '#ffffff'])
    expect(Object.values(palettes.inherit)).toEqual(['currentColor', 'currentColor', 'currentColor'])
  })

  it('writes valid ICO directory offsets for multiple PNG payloads', () => {
    const pngs = [{ size: 16, png: Buffer.from([1, 2, 3]) }, { size: 256, png: Buffer.from([4, 5]) }]
    const ico = encodeIco(pngs)
    expect(ico.readUInt16LE(2)).toBe(1)
    expect(ico.readUInt16LE(4)).toBe(2)
    expect(ico[6]).toBe(16)
    expect(ico[22]).toBe(0)
    expect(ico.readUInt32LE(18)).toBe(38)
    expect(ico.readUInt32LE(34)).toBe(41)
    expect(ico.subarray(38)).toEqual(Buffer.from([1, 2, 3, 4, 5]))
    expect(() => encodeIco([{ size: 512, png: Buffer.alloc(1) }])).toThrow()
  })

  it('rejects external or raster dependencies when importing production parts', () => {
    const part = '<svg viewBox="0 0 100 100"><g transform="scale(1)"><path d="M0 0 L1 1 Z"/></g></svg>'
    expect(parsePart(part).viewBox).toBe('0 0 100 100')
    expect(() => parsePart(part.replace('</svg>', '<image href="remote.png"/></svg>'))).toThrow()
    expect(() => parsePart(part.replace('</svg>', '<script>alert(1)</script></svg>'))).toThrow()
    expect(() => parsePart(part.replace('</g>', '<path d="M1 1 Z"/></g>'))).toThrow()
  })
})
