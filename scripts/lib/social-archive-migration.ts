import fs from 'node:fs'
import path from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
import { pipeline } from 'node:stream/promises'
import { GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, paginateListObjectsV2, type S3Client } from '@aws-sdk/client-s3'
import { archivePath, atomicJson, hashFile, requireArchiveRoot } from './social-archive'

export const SOCIAL_PREFIXES = ['images/social/', 'videos/social/']
export const LEDGER_FILES = ['instagram-post-history.json', 'instagram-reel-history.json', 'viral-series-ledger.json']
export interface MigrationEntry {
  key: string; bytes: number; etag?: string; modified?: string
  archivePath: string; archive: boolean; retainReason?: string
  ledgerIds: string[]; sha256?: string; verifiedAt?: string; deletedAt?: string; error?: string
}
export interface MigrationManifest { version: 1; bucket: string; createdAt: string; entries: MigrationEntry[] }
export interface CloudEvidence {
  syncingComplete: boolean; checkedAt: string
  files: { key: string; driveFileId: string; bytes: number; cloudSizeLabel?: string }[]
}
export interface DependencyCheck { complete: boolean; references: string[]; reason?: string }
export interface DatabaseEvidence extends DependencyCheck { checkedAt: string; databaseFingerprint: string }

export function verifiedDatabaseEvidence(evidence: DatabaseEvidence, databaseUrl: string, now = Date.now()): DependencyCheck {
  const fingerprint = createHash('sha256').update(databaseUrl).digest('hex')
  const checked = Date.parse(evidence.checkedAt)
  if (!evidence.complete || !Array.isArray(evidence.references) || evidence.references.some(r => typeof r !== 'string') || evidence.databaseFingerprint !== fingerprint || !Number.isFinite(checked) || checked > now || now - checked > 24 * 60 * 60 * 1000) {
    return { complete: false, references: [], reason: 'Saved production dependency evidence is invalid or older than 24 hours' }
  }
  return { complete: true, references: evidence.references }
}

export function cloudSizeMatches(bytes: number, label: string): boolean {
  const match = label.match(/([\d.]+)\s*(bytes?|B|KB|MB|GB)\b/i)
  if (!match) return false
  const scale = 1024 ** ({ b: 0, byte: 0, bytes: 0, kb: 1, mb: 2, gb: 3 }[match[2].toLowerCase()] || 0)
  const decimals = match[1].split('.')[1]?.length || 0
  return Math.abs(Number(match[1]) * scale - bytes) <= scale * 0.5 * 10 ** -decimals
}

export function objectKey(value: string): string | undefined {
  // Accept literal keys and historical Neon/CDN URLs, never Zernio URLs.
  if (SOCIAL_PREFIXES.some(prefix => value.startsWith(prefix))) return value.split(/[?#]/)[0]
  try {
    const url = new URL(value)
    if (url.hostname !== 'moltology.org' && !url.hostname.endsWith('.neon.tech')) return undefined
    const pathname = decodeURIComponent(url.pathname).replace(/^\/(?:media|moltology-public-assets)\//, '')
    return SOCIAL_PREFIXES.some(prefix => pathname.startsWith(prefix)) ? pathname : undefined
  } catch { return undefined }
}

export function referencedKeys(value: unknown): string[] {
  if (typeof value === 'string') { const key = objectKey(value); return key ? [key] : [] }
  if (Array.isArray(value)) return value.flatMap(referencedKeys)
  if (value && typeof value === 'object') return Object.values(value).flatMap(referencedKeys)
  return []
}

export function readLedgers(repo: string): { filename: string; document: any; records: any[] }[] {
  return LEDGER_FILES.map(file => {
    const filename = path.join(repo, 'content/social', file)
    const document = JSON.parse(fs.readFileSync(filename, 'utf8'))
    return { filename, document, records: document.posts || document.reels || document.episodes || [] }
  })
}

/** Scan current source/content, excluding archival ledgers and this migration. */
export function sourceReferences(repo: string): string[] {
  const texts: string[] = []
  function walk(directory: string) {
    if (!fs.existsSync(directory)) return
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, item.name)
      if (item.isDirectory()) { if (!item.name.startsWith('.')) walk(filename); continue }
      if (!item.isFile() || !/\.(tsx?|jsx?|json|md|css|html|svg)$/.test(item.name) || /\.test\./.test(item.name) || LEDGER_FILES.includes(item.name) || item.name.includes('social-archive')) continue
      texts.push(fs.readFileSync(filename, 'utf8'))
    }
  }
  for (const folder of ['src', 'scripts', 'content', 'public', 'codex']) walk(path.join(repo, folder))
  return texts
}

export function classifyObject(key: string, records: any[], references: string[]): { archive: boolean; retainReason?: string; ledgerIds: string[]; record?: any } {
  const matches = records.filter(record => referencedKeys(record).includes(key))
  const ledgerIds = matches.map(record => String(record.id))
  const shared = key.startsWith('images/social/outros/') || /share[_-]?card/i.test(key)
  const used = references.some(text => text.includes(key) || text.includes(encodeURIComponent(key)))
  const known = matches.length > 0 || /^(images\/social\/(posts|carousels)\/|videos\/social\/(reels|series)\/)/.test(key)
  return { archive: !shared, ledgerIds, record: matches[0], retainReason: shared ? 'Shared website/template asset' : used ? 'Referenced in current source/content' : !known ? 'Unmatched object; dependencies uncertain' : undefined }
}

export async function inventorySocial(client: S3Client, bucket: string, repo: string): Promise<MigrationManifest> {
  const records = readLedgers(repo).flatMap(ledger => ledger.records)
  const references = sourceReferences(repo)
  const entries: MigrationEntry[] = []
  for (const Prefix of SOCIAL_PREFIXES) {
    for await (const page of paginateListObjectsV2({ client }, { Bucket: bucket, Prefix })) {
      for (const item of page.Contents || []) {
        if (!item.Key || item.Key.endsWith('/')) continue
        const classification = classifyObject(item.Key, records, references)
        // Preserve the S3 hierarchy; safe components are checked by archivePath.
        const folder = classification.ledgerIds.length ? 'Migrated' : 'Legacy'
        entries.push({ key: item.Key, bytes: item.Size || 0, etag: item.ETag, modified: item.LastModified?.toISOString(),
          archivePath: `Social Archive/${folder}/${item.Key}`, archive: classification.archive,
          retainReason: classification.retainReason, ledgerIds: classification.ledgerIds })
      }
    }
  }
  return { version: 1, bucket, createdAt: new Date().toISOString(), entries }
}

export async function verifyEntry(entry: MigrationEntry, root: string): Promise<boolean> {
  const filename = archivePath(root, entry.archivePath)
  if (!entry.sha256 || !fs.existsSync(filename)) return false
  return fs.statSync(filename).size === entry.bytes && await hashFile(filename) === entry.sha256
}

export async function copyEntry(client: S3Client, bucket: string, entry: MigrationEntry, root: string): Promise<void> {
  if (!entry.archive || entry.deletedAt) return
  if (await verifyEntry(entry, root)) { entry.verifiedAt = new Date().toISOString(); delete entry.error; return }
  const filename = archivePath(root, entry.archivePath)
  fs.mkdirSync(path.dirname(filename), { recursive: true })
  const temp = `${filename}.${randomUUID()}.partial`
  try {
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: entry.key, IfMatch: entry.etag }))
    if (!response.Body || response.ContentLength !== entry.bytes || response.ETag !== entry.etag) throw new Error('Source changed since inventory.')
    const hash = createHash('sha256')
    // Hash the source stream separately from the saved file.
    async function* chunks() {
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) { hash.update(chunk); yield chunk }
    }
    await pipeline(chunks(), fs.createWriteStream(temp, { flags: 'wx' }))
    const sha256 = hash.digest('hex')
    if (fs.statSync(temp).size !== entry.bytes || await hashFile(temp) !== sha256) throw new Error('Copied media failed verification.')
    if (fs.existsSync(filename)) {
      if (fs.statSync(filename).size !== entry.bytes || await hashFile(filename) !== sha256) throw new Error('Archive collision; existing file preserved.')
    } else fs.renameSync(temp, filename)
    entry.sha256 = sha256
    entry.verifiedAt = new Date().toISOString()
    delete entry.error
  } finally { fs.rmSync(temp, { force: true }) }
}

export function pruneReason(entry: MigrationEntry, manifest: MigrationManifest, cloud: CloudEvidence | undefined, zernio: DependencyCheck, database: DependencyCheck, references: string[]): string | undefined {
  if (!entry.archive || entry.retainReason) return entry.retainReason || 'Not an archive object'
  if (!entry.verifiedAt || !entry.sha256 || entry.error) return 'Local copy is unverified'
  if (references.some(text => text.includes(entry.key) || text.includes(encodeURIComponent(entry.key)))) return 'Referenced in current source/content'
  if (!zernio.complete) return zernio.reason || 'Zernio dependencies unresolved'
  if (!database.complete) return database.reason || 'Production database dependencies unresolved'
  if ([...zernio.references, ...database.references].some(text => text.includes(entry.key))) return 'Referenced in Zernio or production content'
  const evidence = cloud?.files.find(file => file.key === entry.key)
  if (!cloud?.syncingComplete || !Number.isFinite(Date.parse(cloud.checkedAt)) || Date.parse(cloud.checkedAt) < Date.parse(manifest.createdAt) || Date.now() - Date.parse(cloud.checkedAt) > 24 * 60 * 60 * 1000 || Date.parse(cloud.checkedAt) > Date.now() || !evidence?.driveFileId || evidence.bytes !== entry.bytes) return 'Cloud Drive copy/sync is unverified'
  if (evidence.cloudSizeLabel && !cloudSizeMatches(entry.bytes, evidence.cloudSizeLabel)) return 'Cloud Drive size does not match the verified copy'
}

export async function pruneEntry(client: S3Client, manifest: MigrationManifest, entry: MigrationEntry, root: string): Promise<void> {
  if (!await verifyEntry(entry, root)) throw new Error('Local copy is missing or changed.')
  const head = await client.send(new HeadObjectCommand({ Bucket: manifest.bucket, Key: entry.key }))
  // S3 HEAD uses HTTP dates (whole seconds); listings can retain milliseconds.
  const headModified = head.LastModified ? Math.floor(head.LastModified.getTime() / 1000) : NaN
  const listedModified = entry.modified ? Math.floor(Date.parse(entry.modified) / 1000) : NaN
  if (!entry.etag || head.ETag !== entry.etag || head.ContentLength !== entry.bytes || headModified !== listedModified) throw new Error('Source changed since inventory; retained.')
  // Conditional delete closes the gap between HEAD and DELETE.
  await client.send(new DeleteObjectCommand({ Bucket: manifest.bucket, Key: entry.key, IfMatch: entry.etag }))
  entry.deletedAt = new Date().toISOString()
}

export function updateMigratedLedgers(repo: string, manifest: MigrationManifest): void {
  for (const ledger of readLedgers(repo)) {
    for (const record of ledger.records) {
      const keys = referencedKeys(record)
      const archived = manifest.entries.filter(entry => keys.includes(entry.key) && entry.verifiedAt)
      if (!archived.length) continue
      record.archivePaths = archived.map(entry => entry.archivePath)
      record.s3ArchiveObjects = archived.map(entry => ({ key: entry.key, removedAt: entry.deletedAt || null }))
    }
    atomicJson(ledger.filename, ledger.document)
  }
}

export function writeMigrationMetadata(repo: string, manifest: MigrationManifest, root: string): void {
  requireArchiveRoot(root)
  const ledgers = readLedgers(repo)
  for (const ledger of ledgers) {
    for (const record of ledger.records) {
      const keys = referencedKeys(record)
      const files = manifest.entries.filter(entry => keys.includes(entry.key) && entry.verifiedAt)
      if (!files.length) continue
      // Saved records describe history as recorded; no publication status is inferred.
      const id = createHash('sha256').update(String(record.id)).digest('hex').slice(0, 24)
      const directory = archivePath(root, `Social Archive/Migrated/metadata/${id}`)
      fs.mkdirSync(directory, { recursive: true })
      atomicJson(path.join(directory, 'metadata.json'), { version: 1, legacyRecord: record, files })
    }
  }
  atomicJson(archivePath(root, 'Social Archive/migration-manifest.json'), manifest)
}
