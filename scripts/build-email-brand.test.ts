// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'

describe('email brand export', () => {
  it('reproduces a high-DPI PNG whose content hash matches the deployed asset key', async () => {
    const manifestPath = 'src/emails/components/brand-asset.json'
    const manifestBefore = readFileSync(manifestPath, 'utf8')
    execFileSync(process.execPath, ['--import', 'tsx', 'scripts/build-email-brand.mjs'])
    expect(readFileSync(manifestPath, 'utf8')).toBe(manifestBefore)
    const manifest = JSON.parse(manifestBefore)
    const assets = [
      manifest,
      manifest.footerLockup,
      manifest.social.youtube,
      manifest.social.instagram,
    ]
    for (const asset of assets) {
      const png = readFileSync(path.join('tmp/email-brand', path.basename(asset.key)))
      const revision = createHash('sha256').update(png).digest('hex').slice(0, 12)
      expect(asset.key).toMatch(new RegExp(`^images/email/[a-z-]+-${revision}\\.png$`))
      expect(Array.from(png.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
      const image = await loadImage(png)
      expect(image.width).toBe(asset.width * 3)
      expect(image.height).toBe(asset.height * 3)
      expect(png.length).toBeLessThan(100_000)
    }

    const headerPng = readFileSync(path.join('tmp/email-brand', path.basename(manifest.key)))
    const headerImage = await loadImage(headerPng)
    const headerCanvas = createCanvas(headerImage.width, headerImage.height)
    const headerContext = headerCanvas.getContext('2d')
    headerContext.drawImage(headerImage, 0, 0)
    const headerPixels = headerContext.getImageData(0, 0, headerImage.width, headerImage.height).data
    let redPixels = 0
    for (let i = 0; i < headerPixels.length; i += 4) {
      if (headerPixels[i] > 220 && headerPixels[i + 1] < 100 && headerPixels[i + 2] < 100) redPixels++
    }
    expect(redPixels).toBeGreaterThan(2000)
    expect(manifest.width).toBe(manifest.height)

    const footerPng = readFileSync(path.join('tmp/email-brand', path.basename(manifest.footerLockup.key)))
    const footerImage = await loadImage(footerPng)
    const footerCanvas = createCanvas(footerImage.width, footerImage.height)
    const footerContext = footerCanvas.getContext('2d')
    footerContext.drawImage(footerImage, 0, 0)
    const footerPixels = footerContext.getImageData(0, 0, footerImage.width, footerImage.height).data
    let mutedPixels = 0
    let footerRedPixels = 0
    for (let i = 0; i < footerPixels.length; i += 4) {
      const [r, g, b, a] = [footerPixels[i], footerPixels[i + 1], footerPixels[i + 2], footerPixels[i + 3]]
      if (a > 120 && Math.abs(r - 143) <= 20 && Math.abs(g - 160) <= 20 && Math.abs(b - 160) <= 20) mutedPixels++
      if (r > 200 && g < 100 && b < 100) footerRedPixels++
    }
    expect(mutedPixels).toBeGreaterThan(3000)
    expect(footerRedPixels).toBe(0)
    expect(manifest.footerLockup.width).toBeGreaterThan(manifest.footerLockup.height * 3)
  })
})
