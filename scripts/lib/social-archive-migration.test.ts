import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { createHash } from 'node:crypto'
import type { S3Client } from '@aws-sdk/client-s3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { verifiedDatabaseEvidence, cloudSizeMatches, classifyObject, copyEntry, pruneEntry, pruneReason, referencedKeys, verifyEntry, type MigrationEntry, type MigrationManifest, type CloudEvidence } from './social-archive-migration'

describe('social archive migration', () => {
  let root: string
  let entry: MigrationEntry
  let manifest: MigrationManifest
  const ok = { complete: true, references: [] }
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'social-migration-'))
    entry = { key: 'images/social/posts/a.png', bytes: 5, etag: 'etag', modified: '2026-10-01T00:00:00.000Z', archivePath: 'Social Archive/Migrated/a.png', archive: true, ledgerIds: ['post-a'] }
    manifest = { version: 1, bucket: 'bucket', createdAt: '2026-10-01T00:00:00.000Z', entries: [entry] }
  })
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }))
  function client(body = Readable.from(['hello'])) {
    return { send: vi.fn().mockResolvedValue({ Body: body, ContentLength: 5, ETag: 'etag' }) }
  }
  async function copied() {
    const s3 = client()
    await copyEntry(s3 as unknown as S3Client, 'bucket', entry, root)
    return s3
  }
  function evidence(): CloudEvidence { return { syncingComplete: true, checkedAt: new Date().toISOString(), files: [{ key: entry.key, driveFileId: 'cloud-file-id', bytes: 5 }] } }
  it('rejects incomplete, stale, or differently targeted database evidence', () => {
    const url = 'postgres://test@production/db'
    const evidence = { complete: true, references: [], checkedAt: new Date().toISOString(), databaseFingerprint: createHash('sha256').update(url).digest('hex') }
    expect(verifiedDatabaseEvidence(evidence, url).complete).toBe(true)
    expect(verifiedDatabaseEvidence(evidence, 'postgres://other/db').complete).toBe(false)
    expect(verifiedDatabaseEvidence({ ...evidence, complete: false }, url).complete).toBe(false)
    expect(verifiedDatabaseEvidence({ ...evidence, checkedAt: '2020-01-01' }, url).complete).toBe(false)
  })
  it('compares rounded cloud display sizes without claiming exact remote byte counts', () => {
    expect(cloudSizeMatches(230701, 'Size: 225 KB')).toBe(true)
    expect(cloudSizeMatches(230701, 'Size: 100 KB')).toBe(false)
    expect(cloudSizeMatches(230701, 'Size unavailable')).toBe(false)
  })
  it('copies, independently hashes the saved file, and skips verified reruns', async () => {
    const s3 = await copied()
    expect(await verifyEntry(entry, root)).toBe(true)
    expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/)
    await copyEntry(s3 as unknown as S3Client, 'bucket', entry, root)
    expect(s3.send).toHaveBeenCalledOnce()
  })
  it('resumes a copy interrupted before its manifest checkpoint', async () => {
    await copied()
    delete entry.sha256; delete entry.verifiedAt
    await copied()
    expect(await verifyEntry(entry, root)).toBe(true)
  })
  it('cleans partial downloads and preserves colliding files', async () => {
    const broken = Readable.from((async function* () { yield 'he'; throw new Error('disconnect') })())
    await expect(copyEntry(client(broken) as unknown as S3Client, 'bucket', entry, root)).rejects.toThrow('disconnect')
    const directory = path.dirname(path.join(root, entry.archivePath))
    expect(fs.readdirSync(directory)).toEqual([])
    fs.writeFileSync(path.join(root, entry.archivePath), 'other')
    await expect(copied()).rejects.toThrow('collision')
    expect(fs.readFileSync(path.join(root, entry.archivePath), 'utf8')).toBe('other')
  })
  it('preserves shared, referenced, and unmatched assets', () => {
    expect(classifyObject('images/social/outros/a.jpg', [], []).archive).toBe(false)
    expect(classifyObject(entry.key, [], [entry.key]).retainReason).toContain('Referenced')
    expect(classifyObject('images/social/unknown.jpg', [], []).retainReason).toContain('uncertain')
    expect(classifyObject(entry.key, [{ id: 'a', s3Key: entry.key }], []).ledgerIds).toEqual(['a'])
  })
  it('resolves historical URLs but excludes Zernio URLs', () => {
    expect(referencedKeys({ s3Key: entry.key, slideUrls: [`https://moltology.org/media/${entry.key}`] })).toEqual([entry.key, entry.key])
    expect(referencedKeys(`https://media.zernio.com/${entry.key}`)).toEqual([])
  })
  it('requires cloud sync and per-file availability evidence before pruning', async () => {
    await copied()
    expect(pruneReason(entry, manifest, undefined, ok, ok, [])).toContain('Cloud')
    expect(pruneReason(entry, manifest, { ...evidence(), syncingComplete: false }, ok, ok, [])).toContain('Cloud')
    expect(pruneReason(entry, manifest, { ...evidence(), files: [] }, ok, ok, [])).toContain('Cloud')
    expect(pruneReason(entry, manifest, { ...evidence(), checkedAt: '2026-01-01' }, ok, ok, [])).toContain('Cloud')
    expect(pruneReason(entry, manifest, evidence(), ok, ok, [])).toBeUndefined()
  })
  it('fails closed for unresolved or present runtime dependencies', async () => {
    await copied()
    expect(pruneReason(entry, manifest, evidence(), { complete: false, references: [] }, ok, [])).toContain('Zernio')
    expect(pruneReason(entry, manifest, evidence(), ok, { complete: false, references: [] }, [])).toContain('database')
    expect(pruneReason(entry, manifest, evidence(), ok, { complete: true, references: [entry.key] }, [])).toContain('Referenced')
    expect(pruneReason(entry, manifest, evidence(), ok, ok, [entry.key])).toContain('Referenced')
    entry.retainReason = 'Shared website/template asset'
    expect(pruneReason(entry, manifest, evidence(), ok, ok, [])).toContain('Shared')
  })
  it('rechecks local hashes and source version immediately before conditional deletion', async () => {
    await copied()
    const send = vi.fn().mockResolvedValueOnce({ ETag: 'changed', ContentLength: 5, LastModified: new Date(entry.modified!) })
    await expect(pruneEntry({ send } as unknown as S3Client, manifest, entry, root)).rejects.toThrow('changed')
    expect(send).toHaveBeenCalledOnce()
    entry.modified = '2026-10-01T00:00:00.020Z'
    send.mockReset().mockResolvedValueOnce({ ETag: entry.etag, ContentLength: 5, LastModified: new Date('2026-10-01T00:00:00.000Z') }).mockResolvedValueOnce({})
    await pruneEntry({ send } as unknown as S3Client, manifest, entry, root)
    expect(send.mock.calls[1][0].input.IfMatch).toBe('etag')
    expect(entry.deletedAt).toBeDefined()
  })
  it('does not delete a source when the verified Drive file changed', async () => {
    await copied()
    fs.writeFileSync(path.join(root, entry.archivePath), 'other')
    const send = vi.fn()
    await expect(pruneEntry({ send } as unknown as S3Client, manifest, entry, root)).rejects.toThrow('Local copy')
    expect(send).not.toHaveBeenCalled()
  })
})
