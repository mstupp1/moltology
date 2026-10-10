import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
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
  trimKitImage,
  validateKitSvg,
  prepareKitParts,
  checkKitFolder,
  localKitManifest,
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
    expect(parseKitPath('lobster/eyes/round.svg')).toMatchObject({ group: 'eyes' })
    expect(typeof parseKitPath('lobster/body/classic.svg')).toBe('string')
    expect(typeof parseKitPath('lobster/master.svg')).toBe('string')
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

  it('preserves native pixels and normalizes placement without lossy compression', async () => {
    const source = await sharp({ create: { width: 2048, height: 2048, channels: 4, background: '#00000000' } })
      .composite([{ input: await sharp({ create: { width: 400, height: 600, channels: 4, background: '#de8459' } }).png().toBuffer(), left: 500, top: 700 }])
      .png().toBuffer()
    const trimmed = await trimKitImage(source)
    expect(trimmed).toMatchObject({ x: 249, y: 349, w: 202, h: 302 })
    expect((await sharp(trimmed.webp).metadata()).width).toBe(404)
    expect(trimmed.hash).toBe(createHash('sha256').update(trimmed.webp).digest('hex').slice(0, 10))
    expect(await sharp(trimmed.webp).ensureAlpha().raw().toBuffer()).toEqual(await sharp(trimmed.png).ensureAlpha().raw().toBuffer())
  })

  it('keeps facial SVG geometry after trimming instead of rasterizing the delivery', async () => {
    const source = svg('<ellipse cx="600" cy="420" rx="40" ry="50" fill="#ffffff"/>')
    const trimmed = await trimKitImage(source)
    expect(trimmed.svg?.toString()).toContain('<ellipse')
    expect(trimmed.svg?.toString()).toContain('viewBox=')
    expect((await sharp(trimmed.svg!).metadata()).width).toBe(trimmed.w)
    expect(() => validateKitSvg('<svg><script>bad()</script></svg>')).toThrow()
    expect(() => validateKitSvg('<svg><image href="https://example.com/image"/></svg>')).toThrow()
  })

  it('prepares native raster and vector parts together and rejects duplicate formats', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'kit-hybrid-test-'))
    try {
      await mkdir(path.join(root, 'lobster/eyes'), { recursive: true })
      await mkdir(path.join(root, 'lobster/arm'), { recursive: true })
      await mkdir(path.join(root, 'lobster/iris'), { recursive: true })
      const vector = svg('<ellipse cx="600" cy="420" rx="40" ry="50" fill="#ffffff"/>')
      const raster = await sharp(svg('<rect x="300" y="400" width="120" height="200" fill="#c08060"/>')).resize(2048, 2048).png().toBuffer()
      await writeFile(path.join(root, 'lobster/eyes/round.svg'), vector)
      await writeFile(path.join(root, 'lobster/iris/round.svg'), vector)
      await writeFile(path.join(root, 'lobster/arm/default.png'), raster)
      const checked = await checkKitFolder(root)
      expect(checked.issues).toEqual([])
      const prepared = await prepareKitParts(root, checked.files, {})
      expect(prepared.issues).toEqual([])
      expect((await sharp(prepared.parts.find(p => p.ref.group === 'arm')!.png).metadata()).width).toBe(2048)
      expect(prepared.parts.find(p => p.ref.group === 'eyes')!.svg).toEqual(vector)
      const { manifest, href } = await localKitManifest(prepared.parts)
      expect(href(manifest.assets['lobster/eyes/round'])).toMatch(/^data:image\/svg\+xml;base64,/)
      await writeFile(path.join(root, 'lobster/eyes/round.png'), await sharp(vector).png().toBuffer())
      expect((await checkKitFolder(root)).issues).toContainEqual(expect.objectContaining({ level: 'error', message: 'duplicate layer; deliver one format per part' }))
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

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
