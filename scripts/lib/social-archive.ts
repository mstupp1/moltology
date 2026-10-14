import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'

export interface ArchivedFile { filename: string; bytes: number; sha256: string }
export interface SocialArchive {
  version: 1
  id: string
  relativePath: string
  createdAt: string
  files: ArchivedFile[]
  metadata: Record<string, unknown>
  publication?: Record<string, unknown>
}

/** Root must already exist: never silently archive outside a mounted Drive. */
export function getSocialArchiveRoot(): string {
  if (process.env.SOCIAL_ARCHIVE_ROOT) return path.resolve(process.env.SOCIAL_ARCHIVE_ROOT)
  const storage = path.join(os.homedir(), 'Library/CloudStorage')
  const drives = fs.existsSync(storage) ? fs.readdirSync(storage).filter(n => n.startsWith('GoogleDrive-')) : []
  if (drives.length !== 1) throw new Error('Set SOCIAL_ARCHIVE_ROOT to your Moltology folder in Google Drive.')
  return path.join(storage, drives[0], 'My Drive/Projects/Moltology')
}

export function requireArchiveRoot(root = getSocialArchiveRoot()): string {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new Error(`Social archive folder is unavailable: ${root}. Mount Google Drive or set SOCIAL_ARCHIVE_ROOT.`)
  }
  fs.accessSync(root, fs.constants.R_OK | fs.constants.W_OK)
  return root
}

export async function hashFile(filename: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of fs.createReadStream(filename)) hash.update(chunk)
  return hash.digest('hex')
}

export function atomicJson(filename: string, value: unknown): void {
  const temp = `${filename}.${randomUUID()}.partial`
  try {
    fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
    fs.renameSync(temp, filename)
  } finally { fs.rmSync(temp, { force: true }) }
}

export function archivePath(root: string, relativePath: string): string {
  const destination = path.resolve(root, relativePath)
  if (!destination.startsWith(path.resolve(root) + path.sep)) throw new Error('Archive path escapes its root.')
  return destination
}

export async function archiveSocialMedia(input: {
  kind: 'post' | 'carousel' | 'reel' | 'series'
  files: string[]
  metadata: Record<string, unknown>
  root?: string
  date?: Date
}): Promise<SocialArchive> {
  const root = requireArchiveRoot(input.root)
  if (!input.files.length) throw new Error('An archive requires final media.')
  const files: ArchivedFile[] = []
  for (const [i, filename] of input.files.entries()) {
    const stat = fs.statSync(filename)
    if (!stat.isFile() || stat.size === 0) throw new Error(`Final media is empty or invalid: ${filename}`)
    files.push({ filename: `${String(i + 1).padStart(2, '0')}${path.extname(filename).toLowerCase()}`, bytes: stat.size, sha256: await hashFile(filename) })
  }
  const fingerprint = createHash('sha256').update(JSON.stringify({ kind: input.kind, files, metadata: input.metadata })).digest('hex').slice(0, 24)
  const id = `${input.kind}-${fingerprint}`
  const date = input.date || new Date()
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit' }).formatToParts(date)
  const relativePath = `Social Archive/${parts.find(p => p.type === 'year')!.value}/${parts.find(p => p.type === 'month')!.value}/${id}`
  const directory = archivePath(root, relativePath)
  fs.mkdirSync(directory, { recursive: true })
  const metadataPath = path.join(directory, 'metadata.json')
  const existing: SocialArchive | undefined = fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath, 'utf8')) : undefined
  if (existing && (existing.id !== id || JSON.stringify(existing.files) !== JSON.stringify(files))) throw new Error(`Archive collision: ${relativePath}`)
  for (const [i, file] of files.entries()) {
    const target = path.join(directory, file.filename)
    if (!fs.existsSync(target)) {
      const temp = `${target}.${randomUUID()}.partial`
      try {
        fs.copyFileSync(input.files[i], temp, fs.constants.COPYFILE_EXCL)
        if (await hashFile(temp) !== file.sha256) throw new Error('Final media changed during archiving.')
        // Drive's virtual filesystem does not support hard links.
        fs.copyFileSync(temp, target, fs.constants.COPYFILE_EXCL)
      } finally { fs.rmSync(temp, { force: true }) }
    }
    if (fs.statSync(target).size !== file.bytes || await hashFile(target) !== file.sha256) throw new Error(`Archive collision or corruption: ${target}`)
  }
  const archive: SocialArchive = existing || { version: 1, id, relativePath, createdAt: date.toISOString(), files, metadata: input.metadata }
  atomicJson(metadataPath, archive)
  return archive
}

/** Never retry publishing when a confirmed result is already archived. */
export async function publishArchivedSocial<T extends { postId: string; status: string }>(input: Parameters<typeof archiveSocialMedia>[0], publish: (archivedPaths: string[]) => Promise<T>): Promise<{ archive: SocialArchive; result: T }> {
  const archive = await archiveSocialMedia(input)
  if (archive.publication) return { archive, result: archive.publication as T }
  const root = requireArchiveRoot(input.root)
  const result = await publish(archive.files.map(f => archivePath(root, `${archive.relativePath}/${f.filename}`)))
  archive.publication = result
  try { atomicJson(archivePath(root, `${archive.relativePath}/metadata.json`), archive) }
  catch (error) { throw new Error(`Zernio post ${result.postId} exists, but saving its archive result failed. Reconcile this ID before retrying. ${String(error)}`) }
  return { archive, result }
}
