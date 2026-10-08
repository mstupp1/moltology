import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { COMPOSITE_DIMENSIONS, type CompositeAspectRatio } from '../../src/components/composite/CompositeContainer'
import { extractPalette, readImage, resizeImage, type PaletteSwatch } from './composite-image-tools'

/**
 * Reference library: designs and ads to learn from and recreate as layout specs.
 *
 *   <root>/inbox/            drop zone (any folder depth; folder names become tags)
 *   <root>/library/<id>/     one folder per unique image (id = content hash)
 *       source.<ext>         the original file, moved out of the inbox
 *       preview.jpg          ≤1600px copy for viewing
 *       reference.json       metadata, analysis, recreation status
 *   <root>/index.json        regenerated summary of every reference
 *
 * Reference images are third-party work. They stay in this private library and are never
 * uploaded to the public asset bucket or committed to the repo.
 */

export const REFERENCE_STATUSES = ['new', 'analyzed', 'recreated', 'approved', 'skipped'] as const
export type ReferenceStatus = (typeof REFERENCE_STATUSES)[number]

const zoneSchema = z.object({
  role: z.string(),
  box: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
  notes: z.string().optional(),
})

export const referenceAnalysisSchema = z.object({
  format: z.string(),
  summary: z.string(),
  layout: z.object({
    grid: z.string().optional(),
    focalPoint: z.string().optional(),
    zones: z.array(zoneSchema).optional(),
  }),
  typography: z.object({
    headline: z.string().optional(),
    body: z.string().optional(),
    casing: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  color: z.object({
    background: z.string().optional(),
    accents: z.array(z.string()).optional(),
    contrast: z.string().optional(),
  }).optional(),
  /** Reusable moves, e.g. "giant stat", "before/after split", "product on pedestal". */
  devices: z.array(z.string()),
  copyPattern: z.string().optional(),
  whyItWorks: z.string(),
  borrow: z.array(z.string()).optional(),
  avoid: z.array(z.string()).optional(),
  /** Closest existing template or layout to start from. */
  startFrom: z.string().optional(),
})

export const referenceRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  originalName: z.string(),
  sourceFile: z.string(),
  previewFile: z.string(),
  ingestedAt: z.string(),
  width: z.number(),
  height: z.number(),
  ratio: z.number(),
  nearestAspect: z.string(),
  palette: z.array(z.object({ hex: z.string(), share: z.number() })),
  tags: z.array(z.string()),
  notes: z.string(),
  status: z.enum(REFERENCE_STATUSES),
  analysis: referenceAnalysisSchema.nullable(),
  recreation: z
    .object({
      layoutPath: z.string().optional(),
      renders: z.array(z.string()).optional(),
      comparePath: z.string().optional(),
      notes: z.string().optional(),
    })
    .nullable(),
})

export type ReferenceAnalysis = z.infer<typeof referenceAnalysisSchema>
export type ReferenceRecord = z.infer<typeof referenceRecordSchema>

export function resolveReferenceRoot(): string {
  if (process.env.COMPOSITE_REFERENCE_ROOT) return path.resolve(process.env.COMPOSITE_REFERENCE_ROOT)
  if (fs.existsSync('/mnt/project-files')) return '/mnt/project-files/composite-references'
  return path.resolve(process.cwd(), 'tmp', 'composite-references')
}

const INBOX_README = `Drop designs and ads here: PNG, JPG, WebP, GIF or AVIF, any number, any folder depth.

Folder names become tags (inbox/ads/fitness/x.png is tagged "ads" and "fitness").
A text file with the same name (x.txt or x.md) is attached as notes: what you like about it.

Then run: npm run refs -- ingest
`

export function ensureLibrary(root: string) {
  for (const dir of ['inbox', 'library']) fs.mkdirSync(path.join(root, dir), { recursive: true })
  const readme = path.join(root, 'inbox', 'README.txt')
  if (!fs.existsSync(readme)) fs.writeFileSync(readme, INBOX_README)
}

/** Sniff the real format; project uploads often arrive without an extension. */
export function detectImageType(head: Buffer): string | null {
  if (head.length < 12) return null
  if (head[0] === 0x89 && head.toString('ascii', 1, 4) === 'PNG') return 'png'
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'jpg'
  if (head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  if (head.toString('ascii', 0, 4) === 'GIF8') return 'gif'
  if (head.toString('ascii', 4, 8) === 'ftyp' && /avi[fs]/.test(head.toString('ascii', 8, 12))) return 'avif'
  return null
}

export function nearestCompositeAspect(width: number, height: number): CompositeAspectRatio {
  const ratio = width / height
  let best: CompositeAspectRatio = '4:5'
  let bestDiff = Infinity
  for (const [key, dims] of Object.entries(COMPOSITE_DIMENSIONS) as [CompositeAspectRatio, { width: number; height: number }][]) {
    const diff = Math.abs(Math.log(ratio / (dims.width / dims.height)))
    if (diff < bestDiff) {
      bestDiff = diff
      best = key
    }
  }
  return best
}

export function referenceIdFor(content: Buffer): string {
  return `ref-${crypto.createHash('sha256').update(content).digest('hex').slice(0, 10)}`
}

export function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Untitled reference'
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) return []
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

function moveFile(from: string, to: string) {
  fs.mkdirSync(path.dirname(to), { recursive: true })
  try {
    fs.renameSync(from, to)
  } catch {
    fs.copyFileSync(from, to)
    fs.unlinkSync(from)
  }
}

export interface IngestReport {
  added: ReferenceRecord[]
  duplicates: { file: string; id: string }[]
  skipped: { file: string; reason: string }[]
}

export async function ingestInbox(root: string, options: { dryRun?: boolean } = {}): Promise<IngestReport> {
  ensureLibrary(root)
  const inbox = path.join(root, 'inbox')
  const report: IngestReport = { added: [], duplicates: [], skipped: [] }
  const files = walk(inbox).filter((f) => path.basename(f) !== 'README.txt')
  const noteFiles = new Set(files.filter((f) => /\.(txt|md)$/i.test(f)))

  for (const file of files) {
    if (noteFiles.has(file)) continue
    const rel = path.relative(inbox, file)
    const content = fs.readFileSync(file)
    const type = detectImageType(content.subarray(0, 16))
    if (!type) {
      report.skipped.push({ file: rel, reason: 'not a PNG, JPG, WebP, GIF or AVIF image' })
      continue
    }

    const id = referenceIdFor(content)
    const dir = path.join(root, 'library', id)
    if (fs.existsSync(path.join(dir, 'reference.json'))) {
      report.duplicates.push({ file: rel, id })
      if (!options.dryRun) moveFile(file, path.join(inbox, '_duplicates', rel))
      continue
    }

    const stem = file.replace(/\.[^./]+$/, '')
    const noteFile = [`${stem}.txt`, `${stem}.md`, `${file}.txt`, `${file}.md`].find((n) => noteFiles.has(n))
    const notes = noteFile ? fs.readFileSync(noteFile, 'utf8').trim() : ''
    const tags = path
      .dirname(rel)
      .split(path.sep)
      .filter((part) => part && part !== '.')
      .map((part) => part.toLowerCase())

    if (options.dryRun) {
      report.added.push({ id, title: titleFromFilename(path.basename(file)), originalName: rel } as ReferenceRecord)
      continue
    }

    const sourceFile = `source.${type}`
    moveFile(file, path.join(dir, sourceFile))
    if (noteFile) moveFile(noteFile, path.join(dir, `notes${path.extname(noteFile)}`))

    const img = await readImage(path.join(dir, sourceFile))
    const longEdge = Math.max(img.width, img.height)
    const previewScale = Math.min(1, 1600 / longEdge)
    await resizeImage(
      path.join(dir, sourceFile),
      path.join(dir, 'preview.jpg'),
      Math.round(img.width * previewScale),
      Math.round(img.height * previewScale)
    )

    const record: ReferenceRecord = {
      id,
      title: titleFromFilename(path.basename(file)),
      originalName: rel,
      sourceFile,
      previewFile: 'preview.jpg',
      ingestedAt: new Date().toISOString(),
      width: img.width,
      height: img.height,
      ratio: Math.round((img.width / img.height) * 1000) / 1000,
      nearestAspect: nearestCompositeAspect(img.width, img.height),
      palette: await extractPalette(path.join(dir, sourceFile)),
      tags,
      notes,
      status: 'new',
      analysis: null,
      recreation: null,
    }
    fs.writeFileSync(path.join(dir, 'reference.json'), JSON.stringify(record, null, 2) + '\n')
    report.added.push(record)
  }

  if (!options.dryRun) writeIndex(root)
  return report
}

export interface LoadedReference {
  record: ReferenceRecord
  dir: string
  errors: string[]
}

export function loadReferences(root: string): LoadedReference[] {
  const libraryDir = path.join(root, 'library')
  if (!fs.existsSync(libraryDir)) return []
  return fs
    .readdirSync(libraryDir)
    .filter((id) => fs.existsSync(path.join(libraryDir, id, 'reference.json')))
    .map((id) => {
      const dir = path.join(libraryDir, id)
      const raw = JSON.parse(fs.readFileSync(path.join(dir, 'reference.json'), 'utf8'))
      const parsed = referenceRecordSchema.safeParse(raw)
      return {
        record: (parsed.success ? parsed.data : raw) as ReferenceRecord,
        dir,
        errors: parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      }
    })
    .sort((a, b) => a.record.ingestedAt.localeCompare(b.record.ingestedAt))
}

export function writeIndex(root: string) {
  const index = loadReferences(root).map(({ record, errors }) => ({
    id: record.id,
    title: record.title,
    status: record.status,
    nearestAspect: record.nearestAspect,
    tags: record.tags,
    devices: record.analysis?.devices ?? [],
    layoutPath: record.recreation?.layoutPath ?? null,
    preview: `library/${record.id}/${record.previewFile}`,
    ...(errors.length ? { errors } : {}),
  }))
  fs.writeFileSync(path.join(root, 'index.json'), JSON.stringify({ updatedAt: new Date().toISOString(), references: index }, null, 2) + '\n')
  return index
}

export interface LibrarySummary {
  total: number
  byStatus: Record<string, number>
  byAspect: Record<string, number>
  topDevices: [string, number][]
  topTags: [string, number][]
  invalid: string[]
}

/** Counts that show which layouts are worth turning into reusable specs. */
export function summarizeLibrary(refs: LoadedReference[]): LibrarySummary {
  const count = (values: string[]) =>
    values.reduce<Record<string, number>>((acc, v) => {
      acc[v] = (acc[v] ?? 0) + 1
      return acc
    }, {})
  const top = (values: string[]) => Object.entries(count(values)).sort((a, b) => b[1] - a[1]).slice(0, 12)
  return {
    total: refs.length,
    byStatus: count(refs.map((r) => r.record.status)),
    byAspect: count(refs.map((r) => r.record.nearestAspect)),
    topDevices: top(refs.flatMap((r) => (r.record.analysis?.devices ?? []).map((d) => d.toLowerCase()))),
    topTags: top(refs.flatMap((r) => r.record.tags)),
    invalid: refs.filter((r) => r.errors.length > 0).map((r) => `${r.record.id}: ${r.errors.join('; ')}`),
  }
}

export type { PaletteSwatch }
