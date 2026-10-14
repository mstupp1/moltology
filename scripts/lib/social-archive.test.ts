import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { archiveSocialMedia, publishArchivedSocial, hashFile, archivePath } from './social-archive'

describe('Drive social archive', () => {
  let root: string
  let first: string
  let second: string
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'social-archive-'))
    first = path.join(root, 'a.png'); second = path.join(root, 'b.png')
    fs.writeFileSync(first, 'first'); fs.writeFileSync(second, 'second')
  })
  afterEach(() => { vi.restoreAllMocks(); fs.rmSync(root, { recursive: true, force: true }) })
  const metadata = { caption: 'A reviewed caption', prompts: ['Prompt one', 'Prompt two'], publication: { queueId: 'queue' } }
  const date = new Date('2026-10-01T02:00:00Z')
  it('archives ordered final files and metadata using the channel timezone', async () => {
    const archive = await archiveSocialMedia({ kind: 'carousel', files: [second, first], metadata, root, date })
    expect(archive.relativePath).toContain('Social Archive/2026/09/carousel-')
    expect(archive.files.map(f => f.filename)).toEqual(['01.png', '02.png'])
    const dir = path.join(root, archive.relativePath)
    expect(fs.readFileSync(path.join(dir, '01.png'), 'utf8')).toBe('second')
    expect(archive.files[0].sha256).toBe(await hashFile(second))
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'metadata.json'), 'utf8')).metadata).toEqual(metadata)
  })
  it('stops publishing when Drive is missing or writing fails', async () => {
    const publish = vi.fn()
    await expect(publishArchivedSocial({ kind: 'post', files: [first], metadata, root: path.join(root, 'unmounted') }, publish)).rejects.toThrow('unavailable')
    vi.spyOn(fs, 'copyFileSync').mockImplementation(() => { throw new Error('disk full') })
    await expect(publishArchivedSocial({ kind: 'post', files: [first], metadata, root }, publish)).rejects.toThrow('disk full')
    expect(publish).not.toHaveBeenCalled()
  })
  it('retains final files after Zernio fails and retries the same archive', async () => {
    const input = { kind: 'post' as const, files: [first], metadata, root, date }
    const archive = await archiveSocialMedia(input)
    await expect(publishArchivedSocial(input, async () => { throw new Error('provider offline') })).rejects.toThrow('provider offline')
    expect(fs.existsSync(path.join(root, archive.relativePath, '01.png'))).toBe(true)
    const publish = vi.fn(async paths => { expect(paths[0]).toContain(archive.relativePath); return { postId: 'confirmed', status: 'scheduled', mediaUrls: ['https://media.zernio.com/a'] } })
    const result = await publishArchivedSocial(input, publish)
    expect(result.archive.publication?.postId).toBe('confirmed')
    await publishArchivedSocial(input, publish)
    expect(publish).toHaveBeenCalledOnce()
  })
  it('does not overwrite corrupted or colliding media', async () => {
    const input = { kind: 'post' as const, files: [first], metadata, root, date }
    const archive = await archiveSocialMedia(input)
    const target = path.join(root, archive.relativePath, '01.png')
    fs.writeFileSync(target, 'someone else')
    await expect(archiveSocialMedia(input)).rejects.toThrow('collision or corruption')
    expect(fs.readFileSync(target, 'utf8')).toBe('someone else')
  })
  it('changes identity when final media or reviewed settings change', async () => {
    const input = { kind: 'post' as const, files: [first], metadata, root, date }
    const initial = await archiveSocialMedia(input)
    fs.writeFileSync(first, 'different bytes')
    expect((await archiveSocialMedia(input)).id).not.toBe(initial.id)
    expect((await archiveSocialMedia({ ...input, metadata: { caption: 'different' } })).id).not.toBe(initial.id)
  })
  it('rejects empty media and paths escaping the archive root', async () => {
    fs.writeFileSync(first, '')
    await expect(archiveSocialMedia({ kind: 'post', files: [first], metadata, root })).rejects.toThrow('empty')
    expect(() => archivePath(root, '../escape')).toThrow('escapes')
  })
})
