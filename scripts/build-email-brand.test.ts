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
    const png = readFileSync(path.join('tmp/email-brand', path.basename(manifest.key)))
    const revision = createHash('sha256').update(png).digest('hex').slice(0, 12)
    expect(manifest.key).toBe(`images/email/moltology-lockup-dark-${revision}.png`)
    expect(Array.from(png.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
    const image = await loadImage(png)
    expect(image.width).toBe(manifest.width * 3)
    expect(image.height).toBe(manifest.height * 3)
    expect(png.length).toBeLessThan(100_000)
    // Tee: icon fits 30% of 4800px height; wordmark spans 70% of 3600px width.
    // Check visible red pixels so a regression to the former small emblem fails.
    const canvas = createCanvas(image.width, image.height)
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, image.width, image.height).data
    let minX = image.width
    let maxX = -1
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
      const index = (y * image.width + x) * 4
      if (pixels[index] > 220 && pixels[index + 1] < 100 && pixels[index + 2] < 100) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
      }
    }
    // The emblem's visible red artwork occupies about 87% of its square SVG canvas.
    expect((maxX - minX + 1) / image.width).toBeCloseTo((1440 / 2520) * 0.87, 2)
    expect(manifest.height / manifest.width).toBeCloseTo(0.97, 1)
  })
})
