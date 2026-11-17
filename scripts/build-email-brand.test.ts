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
      manifest.footerEmblem,
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
    const canvas = createCanvas(headerImage.width, headerImage.height)
    const context = canvas.getContext('2d')
    context.drawImage(headerImage, 0, 0)
    const pixels = context.getImageData(0, 0, headerImage.width, headerImage.height).data
    let redPixels = 0
    let lightPixels = 0
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > 220 && pixels[i + 1] < 100 && pixels[i + 2] < 100) redPixels++
      if (pixels[i] > 220 && pixels[i + 1] > 220 && pixels[i + 2] > 220) lightPixels++
    }
    expect(redPixels).toBeGreaterThan(2000)
    expect(lightPixels).toBeGreaterThan(2000)
    expect(manifest.width).toBeGreaterThan(manifest.height * 3)
  })
})
