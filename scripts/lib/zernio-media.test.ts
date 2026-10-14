import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createZernioPost, queueDualReelAndShort, queueInstagramCarousel, queueInstagramPost } from './zernio-client'

const origin = 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets'
const storageUrl = 'https://uploads.r2.cloudflarestorage.com/test?signature=test'
const hosted = 'https://media.zernio.com/temp/test.png'
const json = (data: unknown) => new Response(JSON.stringify(data), { status: 200 })

describe('Zernio hosted publishing media', () => {
  let tempDir: string
  beforeEach(() => {
    vi.stubEnv('ZERNIO_API_KEY', 'test-key')
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zernio-media-'))
    fs.writeFileSync(path.join(tempDir, 'post.png'), new Uint8Array([1, 2, 3]))
    fs.writeFileSync(path.join(tempDir, 'reel.mp4'), new Uint8Array([4, 5, 6]))
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('uploads the local image without reading Neon and queues the hosted URL with existing settings', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ uploadUrl: storageUrl, publicUrl: hosted }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(json({ post: { _id: 'new-post', status: 'scheduled', scheduledFor: '2026-10-15T17:00:00Z' } }))
    const result = await queueInstagramPost({
      mediaUrl: `${origin}/images/social/posts/a.png`, mediaPath: path.join(tempDir, 'post.png'),
      caption: 'A caption', firstComment: 'https://moltology.org/quiz',
    })
    expect(spy).toHaveBeenCalledTimes(3)
    expect(JSON.parse(spy.mock.calls[0][1]!.body as string)).toEqual({ filename: 'post.png', contentType: 'image/png', size: 3 })
    expect(spy.mock.calls[1][0]).toBe(storageUrl)
    expect(spy.mock.calls[1][1]!.headers).toEqual({ 'Content-Type': 'image/png' })
    expect(Array.from(spy.mock.calls[1][1]!.body as Uint8Array)).toEqual([1, 2, 3])
    const payload = JSON.parse(spy.mock.calls[2][1]!.body as string)
    expect(payload.mediaItems).toEqual([{ type: 'image', url: hosted }])
    expect(payload.platforms[0].platformSpecificData).toEqual({ isAiGenerated: true, firstComment: 'https://moltology.org/quiz' })
    expect(result.status).toBe('scheduled')
  })

  it('copies a URL-only Neon source through the CDN before creating the post', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(new Uint8Array([7, 8]), { headers: { 'Content-Type': 'image/png' } }))
      .mockResolvedValueOnce(json({ uploadUrl: storageUrl, publicUrl: hosted }))
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce(json({ post: { _id: 'copied', status: 'scheduled' } }))
    await createZernioPost({ platforms: [], mediaItems: [{ type: 'image', url: `${origin}/images/social/posts/a.png` }] })
    expect(spy.mock.calls[0][0]).toBe('https://moltology.org/media/images/social/posts/a.png')
    expect(JSON.parse(spy.mock.calls[3][1]!.body as string).mediaItems[0].url).toBe(hosted)
  })

  it('stops before post creation when storage upload fails', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ uploadUrl: storageUrl, publicUrl: hosted }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
    await expect(queueInstagramPost({ mediaUrl: `${origin}/a.png`, mediaPath: path.join(tempDir, 'post.png'), caption: 'A caption' }))
      .rejects.toThrow('Zernio media upload failed (HTTP 503)')
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('stops before uploading or creating a post when the source download fails', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 404 }))
    await expect(queueInstagramPost({ mediaUrl: `${origin}/a.png`, caption: 'A caption' })).rejects.toThrow('HTTP 404')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('uploads each carousel slide in order and reuses duplicate media within a post', async () => {
    const firstUrl = `${origin}/images/social/carousels/a/1.png`
    const secondUrl = `${origin}/images/social/carousels/a/2.png`
    const secondHosted = 'https://media.zernio.com/temp/second.png'
    const spy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ uploadUrl: storageUrl, publicUrl: hosted }))
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce(json({ uploadUrl: storageUrl, publicUrl: secondHosted }))
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce(json({ post: { _id: 'carousel', status: 'scheduled' } }))
    await queueInstagramCarousel({
      mediaUrls: [firstUrl, secondUrl, firstUrl], mediaPaths: Array(3).fill(path.join(tempDir, 'post.png')),
      caption: 'A caption', nativeFirstCommentOnly: true,
    })
    expect(spy).toHaveBeenCalledTimes(5)
    expect(JSON.parse(spy.mock.calls[4][1]!.body as string).mediaItems.map((item: { url: string }) => item.url))
      .toEqual([hosted, secondHosted, hosted])
  })

  it('uploads a reel once for both platforms', async () => {
    const hostedVideo = 'https://media.zernio.com/temp/reel.mp4'
    const spy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ uploadUrl: storageUrl, publicUrl: hostedVideo }))
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce(json({ post: { _id: 'reel', status: 'scheduled' } }))
    await queueDualReelAndShort({
      videoUrl: `${origin}/videos/social/reels/a.mp4`, videoPath: path.join(tempDir, 'reel.mp4'),
      instagramCaption: 'Caption', youtubeTitle: 'Title', youtubeDescription: 'Description',
    })
    const payload = JSON.parse(spy.mock.calls[2][1]!.body as string)
    expect(spy).toHaveBeenCalledTimes(3)
    expect(payload.mediaItems).toEqual([{ type: 'video', url: hostedVideo }])
    expect(payload.platforms.map((p: { platform: string }) => p.platform)).toEqual(['instagram', 'youtube'])
  })

  it('does not upload, download, or read missing files in any dry-run path', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    await queueInstagramPost({ mediaUrl: `${origin}/a.png`, mediaPath: '/missing', caption: 'Caption', dryRun: true })
    await queueInstagramCarousel({ mediaUrls: [`${origin}/a.png`], mediaPaths: ['/missing'], caption: 'Caption', dryRun: true })
    await queueDualReelAndShort({ videoUrl: `${origin}/a.mp4`, videoPath: '/missing', instagramCaption: 'Caption', youtubeTitle: 'Title', youtubeDescription: 'Description', dryRun: true })
    expect(spy).not.toHaveBeenCalled()
  })

  it('rejects mismatched carousel paths before any network calls', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    await expect(queueInstagramCarousel({ mediaUrls: [`${origin}/a.png`], mediaPaths: [], caption: 'Caption' }))
      .rejects.toThrow('Carousel file count')
    expect(spy).not.toHaveBeenCalled()
  })

  it('rejects wrong media types before contacting Zernio', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    await expect(queueInstagramPost({ mediaUrl: `${origin}/a.png`, mediaPath: path.join(tempDir, 'reel.mp4'), caption: 'Caption' }))
      .rejects.toThrow('Expected image media')
    expect(spy).not.toHaveBeenCalled()
  })

  it('stops before uploading when the next queue slot exceeds temporary media lifetime', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json({ nextSlot: new Date(Date.now() + 10 * 86400000).toISOString(), timezone: 'America/New_York' }))
    await expect(queueInstagramPost({ mediaPath: path.join(tempDir, 'post.png'), caption: 'Caption', validateMediaWindow: true })).rejects.toThrow('expire after seven days')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('accepts local-only inputs and returns the hosted media URLs', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ uploadUrl: storageUrl, publicUrl: hosted }))
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce(json({ post: { _id: 'local', status: 'scheduled' } }))
    const result = await queueInstagramPost({ mediaPath: path.join(tempDir, 'post.png'), caption: 'Caption' })
    expect(result.mediaUrls).toEqual([hosted])
    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('rejects missing media and mismatched local slide counts before uploading', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    await expect(queueInstagramPost({ caption: 'Caption' })).rejects.toThrow('requires')
    await expect(queueInstagramCarousel({ mediaUrls: [hosted], mediaPaths: [], caption: 'Caption' })).rejects.toThrow('count')
    expect(spy).not.toHaveBeenCalled()
  })

  it('keeps local-only retry identities stable across file renames and changes them for different bytes', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).endsWith('/media/presign')) return json({ uploadUrl: storageUrl, publicUrl: hosted })
      if (url === storageUrl) return new Response(null)
      return json({ post: { _id: 'id', status: 'scheduled' } })
    })
    const original = path.join(tempDir, 'post.png')
    await queueInstagramPost({ mediaPath: original, caption: 'Caption' })
    const renamed = path.join(tempDir, 'renamed.png')
    fs.renameSync(original, renamed)
    await queueInstagramPost({ mediaPath: renamed, caption: 'Caption' })
    fs.writeFileSync(renamed, new Uint8Array([9, 8, 7]))
    await queueInstagramPost({ mediaPath: renamed, caption: 'Caption' })
    const keys = [2, 5, 8].map(i => (spy.mock.calls[i][1]!.headers as Record<string, string>)['Idempotency-Key'])
    expect(keys[0]).toBe(keys[1])
    expect(keys[2]).not.toBe(keys[0])
  })

  it('keeps an identical idempotency key when a retry uploads a fresh hosted URL', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ uploadUrl: storageUrl, publicUrl: hosted }))
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce(json({ post: { _id: 'same-post', status: 'scheduled' } }))
      .mockResolvedValueOnce(json({ uploadUrl: storageUrl, publicUrl: 'https://media.zernio.com/temp/retry.png' }))
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce(json({ post: { _id: 'same-post', status: 'scheduled' } }))
    const options = { mediaUrl: `${origin}/a.png`, mediaPath: path.join(tempDir, 'post.png'), caption: 'Caption' }
    await queueInstagramPost(options)
    await queueInstagramPost(options)
    const firstHeaders = spy.mock.calls[2][1]!.headers as Record<string, string>
    const retryHeaders = spy.mock.calls[5][1]!.headers as Record<string, string>
    expect(firstHeaders['Idempotency-Key']).toMatch(/^[a-f0-9]{64}$/)
    expect(retryHeaders['Idempotency-Key']).toBe(firstHeaders['Idempotency-Key'])
    expect(JSON.parse(spy.mock.calls[2][1]!.body as string).mediaItems[0].url)
      .not.toBe(JSON.parse(spy.mock.calls[5][1]!.body as string).mediaItems[0].url)
  })
})
