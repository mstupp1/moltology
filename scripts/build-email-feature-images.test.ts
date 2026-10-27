// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { expect, it } from 'vitest'

it('reproduces small email-compatible JPEGs with content-addressed public keys', async () => {
  const manifestPath = 'src/emails/components/feature-assets.json'
  const before = readFileSync(manifestPath, 'utf8')
  execFileSync(process.execPath, ['scripts/build-email-feature-images.mjs'])
  expect(readFileSync(manifestPath, 'utf8')).toBe(before)
  const manifest = JSON.parse(before)
  expect(Object.keys(manifest)).toEqual(['dashboard', 'oracle', 'forum'])
  for (const [name, asset] of Object.entries(manifest) as [string, { key: string; revision: string; width: number; height: number }][]) {
    const bytes = readFileSync(path.join('tmp/email-features', path.basename(asset.key)))
    const revision = createHash('sha256').update(bytes).digest('hex').slice(0, 12)
    expect(asset.key).toBe(`images/email/welcome-${name}-${revision}.jpg`)
    expect(asset.revision).toBe(revision)
    const metadata = await sharp(bytes).metadata()
    expect(metadata.format).toBe('jpeg')
    expect(metadata.width).toBe(860)
    expect(metadata.height).toBe(430)
    expect(bytes.length).toBeLessThan(100_000)
  }
})
