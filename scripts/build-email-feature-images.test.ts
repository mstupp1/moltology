// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { expect, it, vi } from 'vitest'
import { needsEmailRefresh, publishImages, verifyImage } from './build-email-feature-images.mjs'
import { DEFAULT_CAPTURE_TARGETS, REGISTERED_TARGETS } from './lib/mockup-targets'

it('reproduces current email JPEGs without changing the released manifest', async () => {
  const manifestPath = 'src/emails/components/feature-assets.json'
  const before = readFileSync(manifestPath, 'utf8')
  execFileSync(process.execPath, ['scripts/build-email-feature-images.mjs', '--check'])
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

it('refreshes email images only when the selected captures replace an email source', () => {
  expect(needsEmailRefresh(DEFAULT_CAPTURE_TARGETS)).toBe(true)
  for (const sector of ['dashboard', 'oracle', 'forum']) {
    expect(needsEmailRefresh([REGISTERED_TARGETS[`${sector}_feature`]])).toBe(true)
  }
  expect(needsEmailRefresh(Object.values(REGISTERED_TARGETS).filter((target) => /_(desktop|mobile)$/.test(target.name)))).toBe(false)
  expect(needsEmailRefresh([REGISTERED_TARGETS.moltmax_feature])).toBe(false)
})

it('rejects missing, HTML, corrupt, wrong-sized and mismatched public images', async () => {
  const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).jpeg().toBuffer()
  const revision = createHash('sha256').update(image).digest('hex').slice(0, 12)
  const asset = { key: `images/email/test-${revision}.jpg`, revision, width: 2, height: 2 }
  const response = (body: BodyInit, type = 'image/jpeg', status = 200) => async () => new Response(body, { status, headers: { 'content-type': type } })
  await expect(verifyImage(asset, response(image))).resolves.toBeUndefined()
  await expect(verifyImage(asset, response('', 'image/jpeg', 404))).rejects.toThrow('unavailable')
  await expect(verifyImage(asset, response('<html>', 'text/html'))).rejects.toThrow('content type')
  await expect(verifyImage(asset, response('corrupt'))).rejects.toThrow()
  await expect(verifyImage({ ...asset, width: 3 }, response(image))).rejects.toThrow('dimensions/content')
  await expect(verifyImage({ ...asset, revision: 'wrong' }, response(image))).rejects.toThrow('dimensions/content')
})

it('preserves the released manifest on upload/CDN failures and commits only after verification', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'email-publish-test-'))
  const destination = path.join(projectRoot, 'src/emails/components/feature-assets.json')
  await fs.mkdir(path.dirname(destination), { recursive: true })
  await fs.writeFile(destination, 'previous manifest')
  const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).jpeg().toBuffer()
  const revision = createHash('sha256').update(bytes).digest('hex').slice(0, 12)
  const manifest = { dashboard: { key: `images/email/test-${revision}.jpg`, revision, width: 2, height: 2 } }
  const upload = vi.fn()
  try {
    await expect(publishImages(manifest, { projectRoot, upload: () => { throw new Error('upload failed') } })).rejects.toThrow('upload failed')
    expect(await fs.readFile(destination, 'utf8')).toBe('previous manifest')
    await expect(publishImages(manifest, { projectRoot, upload, fetchImage: async () => new Response('', { status: 404 }) })).rejects.toThrow('unavailable')
    expect(await fs.readFile(destination, 'utf8')).toBe('previous manifest')
    const fetchImage = vi.fn(async (url: string) => {
      expect(upload).toHaveBeenCalled()
      expect(await fs.readFile(destination, 'utf8')).toBe('previous manifest')
      expect(url).toBe(`https://moltology.org/media/${manifest.dashboard.key}?v=${revision}`)
      return new Response(bytes, { headers: { 'content-type': 'image/jpeg' } })
    })
    await publishImages(manifest, { projectRoot, upload, fetchImage })
    expect(JSON.parse(await fs.readFile(destination, 'utf8'))).toEqual(manifest)
    expect(fetchImage).toHaveBeenCalledOnce()
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true })
  }
})
