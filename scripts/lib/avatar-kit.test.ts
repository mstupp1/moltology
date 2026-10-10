import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import {
  allowedVariants,
  extractAddition,
  loadRgba,
  parseKitPath,
  pixelStats,
  registerToMaster,
  rgbaToPng,
  splitIris,
  toClay,
  transformRgba,
} from './avatar-kit'

describe('avatar kit file names', () => {
  it('reads race, layer, and variant from the path', () => {
    expect(parseKitPath('lobster/claw/crusher.png')).toMatchObject({ race: 'lobster', group: 'claw', variant: 'crusher', tinted: true, mirrored: true })
    expect(parseKitPath('crab/master.webp')).toMatchObject({ race: 'crab', group: 'master' })
    expect(parseKitPath('lobster/mouth/grin.png')).toMatchObject({ tinted: false, mirrored: false })
    expect(parseKitPath('lobster/gear/hammer.png')).toMatchObject({ group: 'gear', mirrored: true })
    expect(parseKitPath('lobster/look/gilded-pincer.png')).toMatchObject({ group: 'look', mirrored: true })
    expect(parseKitPath('lobster/look/reef-crown.png')).toMatchObject({ group: 'look', mirrored: false })
  })

  it('rejects unknown races, layers, variants, and formats', () => {
    expect(typeof parseKitPath('shrimp/claw/classic.png')).toBe('string')
    expect(typeof parseKitPath('crab/tail/default.png')).toBe('string')
    expect(typeof parseKitPath('lobster/claw/laser.png')).toBe('string')
    expect(typeof parseKitPath('lobster/claw/classic.jpg')).toBe('string')
    expect(typeof parseKitPath('lobster/claw.png')).toBe('string')
  })

  it('lists variants from the spec and catalog', () => {
    expect(allowedVariants('lobster', 'head')).toContain('heart')
    expect(allowedVariants('crab', 'look')).toContain('reef-crown')
    expect(allowedVariants('crab', 'tail')).toBeNull()
  })
})

describe('avatar kit pixel tools', () => {
  // A fake "master": a shaded body with a coloured eye, drawn as SVG.
  const svg = (inner: string) =>
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
      <defs><radialGradient id="g" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#ff9a7a"/><stop offset="1" stop-color="#8a2a1a"/></radialGradient></defs>
      ${inner}</svg>`)
  const body = '<ellipse cx="512" cy="560" rx="220" ry="300" fill="url(#g)"/><rect x="420" y="380" width="60" height="40" fill="#203040"/>'
  const eye = '<circle cx="600" cy="420" r="40" fill="#ffffff"/><circle cx="600" cy="420" r="22" fill="#2a8a3a"/><circle cx="600" cy="420" r="8" fill="#000"/>'

  it('snaps a shifted, rescaled part back onto the master', async () => {
    const master = await sharp(svg(body + eye)).png().toBuffer()
    const part = await rgbaToPng(await transformRgba(await loadRgba(master), 30, -18, 1.03))
    const fit = await registerToMaster(part, master)
    expect(Math.abs(fit.dx + 30)).toBeLessThanOrEqual(16)
    expect(Math.abs(fit.dy - 18)).toBeLessThanOrEqual(16)
    expect(fit.score).toBeLessThan(fit.identity)
  }, 30_000)

  it('cuts an added item out of an edit of the master', async () => {
    const master = await sharp(svg(body + eye)).png().toBuffer()
    const edited = await sharp(svg(`${body}${eye}<rect x="380" y="200" width="260" height="90" fill="#f0c020"/>`)).png().toBuffer()
    const { layer } = await extractAddition(master, edited)
    const stats = await pixelStats(await rgbaToPng(layer))
    expect(stats.bbox).not.toBeNull()
    expect(stats.bbox!.y).toBeGreaterThan(180)
    expect(stats.bbox!.y + stats.bbox!.h).toBeLessThan(310)
  }, 30_000)

  it('turns colour into grey clay and splits irises from eyes', async () => {
    const eyes = await loadRgba(await sharp(svg(eye)).png().toBuffer())
    const { eyes: rest, iris, irisShare } = splitIris(eyes)
    expect(irisShare).toBeGreaterThan(0.1)
    expect((await pixelStats(await rgbaToPng(iris))).bbox?.w).toBeLessThanOrEqual(48)
    expect((await pixelStats(await rgbaToPng(rest))).bbox?.w).toBeGreaterThanOrEqual(78)
    const clay = await pixelStats(await rgbaToPng(toClay(await loadRgba(await sharp(svg(body)).png().toBuffer()))))
    expect(clay.meanSaturation).toBe(0)
  })
})
