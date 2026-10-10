#!/usr/bin/env node
/**
 * Avatar kit art pipeline.
 *
 *   npm run avatar:kit -- guides                 Render pose guides from the vector rig
 *   npm run avatar:kit -- shots                  Write the shot list (content/avatar-kit/SHOT_LIST.md)
 *   npm run avatar:kit -- check <dir>            Validate, align, and recolour a delivery; render a preview sheet
 *   npm run avatar:kit -- extract <master> <edited> --out <file>
 *                                                Cut a gear/look item out of "the master wearing X"
 *   npm run avatar:kit -- upload-inbox <dir> --batch <name>
 *                                                Upload a checked delivery to the bucket inbox
 *   npm run avatar:kit -- ingest <dir> | --inbox <name> [--dry-run]
 *                                                Trim, upload webp parts, and update manifest.json
 *   npm run avatar:kit -- preview [--out file.png]
 *                                                Contact sheet from the committed manifest
 *   npm run avatar:kit -- sync-all [--dry-run]   Re-write every member's loadout and portrait
 *
 * Delivery folder layout: <race>/master.png, <race>/<layer>/<variant>.png,
 * <race>/gear/<visualType>.png, <race>/look/<artKey>.png, <race>/accessory/<accessory>.png.
 * Every file is a square transparent canvas (1024 px or larger). Parts are snapped onto the race's master,
 * recoloured layers are turned to grey clay, and gear/looks drawn on the whole character are
 * cut out, so art can come straight from image edits of the master. Optional
 * <race>/pivots.json overrides the idle-motion pivots.
 */
import 'dotenv/config'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { AVATAR_RACES, type AvatarRace } from '../src/lib/avatar/traits'
import {
  KIT_ACCESSORIES,
  KIT_CANVAS_PX,
  KIT_CENTER_X,
  KIT_DEFAULT_PIVOTS,
  KIT_GEAR_BRIEFS,
  KIT_GROUND_Y,
  KIT_RACE_LAYERS,
} from '../src/lib/avatar/kit/spec'
import { isKitRaceReady } from '../src/lib/avatar/kit/compose'
import type { KitAsset, KitManifest } from '../src/lib/avatar/kit/manifest'
import { serializeKitLoadout, type KitLoadout } from '../src/lib/avatar/kit/loadout'
import { buildAvatarSvg, generateLobsterAvatarSvg, type LobsterAvatarConfig } from '../src/lib/lobster-avatar'
import { COSMETIC_CATALOG } from '../src/lib/equipment-seed-data'
import { DEFAULT_BUCKET, getS3Client } from '../src/lib/s3-client'
import {
  KIT_BUCKET_PREFIX,
  KIT_INBOX_PREFIX,
  KIT_SOURCE_PREFIX,
  checkKitFolder,
  extractAddition,
  fileExists,
  listImageFiles,
  localKitManifest,
  prepareKitParts,
  readJson,
  readKitPivots,
  rgbaToPng,
  trimKitImage,
  type CheckIssue,
  type KitFileRef,
} from './lib/avatar-kit'

const ROOT = path.resolve(import.meta.dirname, '..')
const CONTENT_DIR = path.join(ROOT, 'content/avatar-kit')
const MANIFEST_PATH = path.join(ROOT, 'src/lib/avatar/kit/manifest.json')

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i > 0 ? process.argv[i + 1] : undefined
}
const flag = (name: string) => process.argv.includes(name)

// ─── Rendering helpers ───────────────────────────────────────────────────────

const DEFAULT_TRAITS = {
  headShape: 'bean',
  build: 'classic',
  claws: 'classic',
  antennae: 'whip',
  mouth: 'grin',
  eyeVariant: 'round',
  pose: 'cheer',
  height: 'regular',
  accessory: 'none',
  shellColor: 'coral',
  shellFinish: 'glossy',
  marking: 'none',
  eyeColor: 'amber',
  eyelidStyle: 'open',
  pupilVariant: 'standard',
} as const

function baseConfig(race: AvatarRace, extra: Partial<LobsterAvatarConfig> = {}): LobsterAvatarConfig {
  return { style: 'critters', seed: `kit-${race}`, race, ...DEFAULT_TRAITS, ...extra } as LobsterAvatarConfig
}

async function svgToPng(svg: string, px: number): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 144 }).resize(px, px).png().toBuffer()
}

async function renderTile(
  config: LobsterAvatarConfig,
  manifest: KitManifest,
  href: (a: KitAsset) => string,
  px = 384,
  frame: 'fullBody' | 'portrait' = 'fullBody'
): Promise<Buffer> {
  const svg = buildAvatarSvg({ ...config, backgroundMotion: 'static' }, px, frame, `tile-${frame}`, {
    kit: true,
    kitManifest: manifest,
    kitHref: href,
  })
  return svgToPng(svg, px)
}

async function contactSheet(tiles: Buffer[], cols: number, px: number): Promise<Buffer> {
  const rows = Math.ceil(tiles.length / cols)
  const gap = 8
  return sharp({
    create: { width: cols * px + (cols + 1) * gap, height: rows * px + (rows + 1) * gap, channels: 4, background: '#0b1013' },
  })
    .composite(tiles.map((input, i) => ({ input, left: gap + (i % cols) * (px + gap), top: gap + Math.floor(i / cols) * (px + gap) })))
    .png()
    .toBuffer()
}

/** A spread of looks per ready race: defaults, palettes and finishes, gear, cosmetics, portraits. */
async function previewSheet(manifest: KitManifest, href: (a: KitAsset) => string): Promise<Buffer | null> {
  const tiles: Buffer[] = []
  for (const race of AVATAR_RACES) {
    if (!isKitRaceReady(race, manifest)) continue
    const gear: KitLoadout = {
      gear: {
        head: { visual: 'helm', rarity: 'rare' },
        carapace: { visual: 'carapace', rarity: 'common' },
        'claws-1': { visual: 'pincer', rarity: 'epic' },
        'claws-2': { visual: 'hammer', rarity: 'legendary' },
        belt: { visual: 'belt', rarity: 'uncommon' },
        legs: { visual: 'greaves', rarity: 'common' },
        antennae: { visual: 'antennae', rarity: 'rare' },
      },
      look: {},
    }
    const looks: KitLoadout = { gear: {}, look: {} }
    for (const c of COSMETIC_CATALOG) {
      const key = `${race}/look/${c.artKey}`
      if (manifest.assets[key] && !looks.look[c.category as keyof KitLoadout['look']]) {
        looks.look[c.category as keyof KitLoadout['look']] = c.artKey as string
      }
    }
    const configs: LobsterAvatarConfig[] = [
      baseConfig(race),
      baseConfig(race, { shellColor: 'cobalt', shellFinish: 'satin', eyeColor: 'emerald', mouth: 'smile' }),
      baseConfig(race, { shellColor: 'gold', shellFinish: 'chrome', eyeColor: 'sapphire', height: 'tall' }),
      baseConfig(race, { shellColor: 'orchid', shellFinish: 'glow', eyeColor: 'ruby', height: 'short' }),
      baseConfig(race, { shellColor: 'lagoon', loadout: serializeKitLoadout(gear) }),
      baseConfig(race, { shellColor: 'obsidian', loadout: serializeKitLoadout(looks) }),
    ]
    for (const c of configs) tiles.push(await renderTile(c, manifest, href))
    tiles.push(await renderTile(baseConfig(race), manifest, href, 384, 'portrait'))
    tiles.push(await renderTile(baseConfig(race, { shellColor: 'cobalt', loadout: serializeKitLoadout(gear) }), manifest, href, 384, 'portrait'))
  }
  return tiles.length ? contactSheet(tiles, 4, 384) : null
}

/** Inspect real display sizes against both backgrounds, rather than enlarging thumbnails. */
async function qualitySheet(manifest: KitManifest, href: (a: KitAsset) => string): Promise<Buffer | null> {
  const tiles: Buffer[] = []
  for (const race of AVATAR_RACES) {
    if (!isKitRaceReady(race, manifest)) continue
    for (const background of ['#f5f3ef', '#09131b']) {
      for (const size of [128, 256, 384]) {
        const portrait = size === 384
        const picture = await renderTile(baseConfig(race, { transparentBackground: true, shellColor: 'cobalt', eyeColor: 'emerald', shellFinish: 'satin' }), manifest, href, size, portrait ? 'portrait' : 'fullBody')
        const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="416" height="416"><text x="208" y="409" text-anchor="middle" font-family="sans-serif" font-size="13" fill="${background === '#09131b' ? '#ffffff' : '#111111'}">${size}px ${portrait ? 'portrait' : 'avatar'}</text></svg>`)
        tiles.push(await sharp({ create: { width: 416, height: 416, channels: 4, background } })
          .composite([{ input: picture, left: Math.round((416 - size) / 2), top: Math.round((392 - size) / 2) }, { input: label }]).png().toBuffer())
      }
    }
  }
  return tiles.length ? contactSheet(tiles, 3, 416) : null
}

// ─── Commands ────────────────────────────────────────────────────────────────

/** Pose guides drawn from the vector rig, so new art lands in the frame the renderer expects. */
async function guides() {
  const outDir = path.join(CONTENT_DIR, 'guides')
  await mkdir(outDir, { recursive: true })
  for (const race of AVATAR_RACES) {
    const svg = generateLobsterAvatarSvg(baseConfig(race, { transparentBackground: true }), KIT_CANVAS_PX, {
      frame: 'fullBody',
      staticMotion: true,
    })
    if (!svg) throw new Error(`could not render ${race}`)
    const pose = await svgToPng(svg, KIT_CANVAS_PX)
    await writeFile(path.join(outDir, `${race}-pose.png`), await sharp(pose).png({ compressionLevel: 9, palette: true }).toBuffer())

    const p = KIT_DEFAULT_PIVOTS[race]
    const dot = (pt: readonly [number, number], label: string) =>
      `<circle cx="${pt[0]}" cy="${pt[1]}" r="9" fill="none" stroke="#ff3b8b" stroke-width="4"/><text x="${pt[0] + 14}" y="${pt[1] + 6}" font-size="22" font-family="sans-serif" fill="#ff3b8b">${label}</text>`
    const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${KIT_CANVAS_PX}" height="${KIT_CANVAS_PX}">
      <rect width="100%" height="100%" fill="#f4f1ea"/>
      <line x1="${KIT_CENTER_X}" y1="0" x2="${KIT_CENTER_X}" y2="${KIT_CANVAS_PX}" stroke="#2f7ff0" stroke-width="2" stroke-dasharray="12 8"/>
      <line x1="0" y1="${KIT_GROUND_Y}" x2="${KIT_CANVAS_PX}" y2="${KIT_GROUND_Y}" stroke="#18a058" stroke-width="2" stroke-dasharray="12 8"/>
      <text x="16" y="${KIT_GROUND_Y - 10}" font-size="22" font-family="sans-serif" fill="#18a058">ground (feet rest here)</text>
      <text x="${KIT_CENTER_X + 10}" y="30" font-size="22" font-family="sans-serif" fill="#2f7ff0">centre / mirror line</text>
      <rect x="0" y="0" width="${KIT_CENTER_X}" height="${KIT_CANVAS_PX}" fill="#2f7ff0" fill-opacity="0.04"/>
      <text x="16" y="30" font-size="22" font-family="sans-serif" fill="#2f7ff0">screen-left: paint mirrored parts here</text>
    </svg>`
    const marks = `<svg xmlns="http://www.w3.org/2000/svg" width="${KIT_CANVAS_PX}" height="${KIT_CANVAS_PX}">${dot(p.antenna, 'antenna root')}${dot(p.shoulder, 'shoulder')}${race === 'lobster' ? dot(p.tail, 'tail hinge') : ''}</svg>`
    const guide = await sharp(Buffer.from(overlay))
      .composite([{ input: pose }, { input: Buffer.from(marks) }])
      .png({ compressionLevel: 9, palette: true })
      .toBuffer()
    await writeFile(path.join(outDir, `${race}-guide.png`), guide)
    console.log(`✓ ${race}: guides/${race}-pose.png, guides/${race}-guide.png`)
  }
}

interface Shot {
  batch: number
  file: string
  what: string
  colour: 'recoloured by the app' | 'kept as painted'
  notes: string[]
}

function shotList(): Shot[] {
  const shots: Shot[] = []
  const core = (race: AvatarRace) => (race === 'lobster' ? 1 : 2)
  for (const race of AVATAR_RACES) {
    shots.push({
      batch: core(race),
      file: `${race}/master.png`,
      what: `The full ${race} in the house style: front view, cheer pose, every default part, no gear.`,
      colour: 'kept as painted',
      notes: [`Match guides/${race}-pose.png for pose, proportions, and framing.`, 'Every other file is cut from or painted over this one.'],
    })
    for (const spec of KIT_RACE_LAYERS[race]) {
      for (const variant of spec.variants) {
        const isDefault = variant === spec.defaultVariant
        shots.push({
          batch: isDefault ? core(race) : 4,
          file: `${race}/${spec.id}/${variant}.${['eyes', 'iris', 'brows', 'lids', 'mouth'].includes(spec.id) ? 'svg' : 'png'}`,
          what: `${spec.brief}${spec.trait ? ` Variant: ${variant}.` : ''}`,
          colour: spec.tint ? 'recoloured by the app' : 'kept as painted',
          notes: [
            ...(spec.mirrored ? ['Screen-left only. The app mirrors it for the right side.'] : []),
            ...(spec.required ? [] : ['Optional for launch.']),
          ],
        })
      }
    }
    for (const visual of Object.keys(KIT_GEAR_BRIEFS) as (keyof typeof KIT_GEAR_BRIEFS)[]) {
      const first = race === 'lobster' && ['helm', 'carapace', 'pincer', 'belt'].includes(visual)
      shots.push({
        batch: first ? 1 : 2,
        file: `${race}/gear/${visual}.png`,
        what: KIT_GEAR_BRIEFS[visual],
        colour: 'kept as painted',
        notes: ['Neutral metal and chitin tones; rarity glow is added by the app.', 'Deliver as the master wearing it; the item is cut out automatically.'],
      })
    }
    for (const c of COSMETIC_CATALOG) {
      shots.push({
        batch: race === 'lobster' && c.artKey === 'reef-crown' ? 1 : 3,
        file: `${race}/look/${c.artKey}.png`,
        what: `${c.name} (${c.category}). ${c.flavorText}`,
        colour: 'kept as painted',
        notes: [
          'Deliver as the master wearing it; the item is cut out automatically.',
          ...(c.category === 'claws' || c.category === 'antennae' ? ['Screen-left only; drawn on both sides by the app.'] : []),
        ],
      })
    }
    for (const acc of KIT_ACCESSORIES) {
      shots.push({
        batch: 4,
        file: `${race}/accessory/${acc}.png`,
        what: `Creator accessory: ${acc.replace('_', ' ')}, worn on the head.`,
        colour: 'kept as painted',
        notes: ['Deliver as the master wearing it; the item is cut out automatically.'],
      })
    }
  }
  return shots.sort((a, b) => a.batch - b.batch || a.file.localeCompare(b.file))
}

const BATCH_TITLES: Record<number, string> = {
  1: 'Batch 1: lobster core, first gear, one look',
  2: 'Batch 2: crab core and the rest of the gear',
  3: 'Batch 3: cosmetics (looks)',
  4: 'Batch 4: trait variants and creator accessories',
}

async function shots() {
  const list = shotList()
  await mkdir(CONTENT_DIR, { recursive: true })
  await writeFile(path.join(CONTENT_DIR, 'shot-list.json'), `${JSON.stringify(list, null, 2)}\n`)
  const lines = [
    '# Avatar kit shot list',
    '',
    'Generated by `npm run avatar:kit -- shots` from `src/lib/avatar/kit/spec.ts`. Do not edit by hand.',
    'How to paint and deliver these: `.agents/skills/avatar-kit-art/SKILL.md`.',
    'Facial vectors and native-resolution exports: `content/avatar-kit/HYBRID_WORKFLOW.md`.',
    '',
  ]
  for (const batch of [1, 2, 3, 4]) {
    const rows = list.filter((s) => s.batch === batch)
    lines.push(`## ${BATCH_TITLES[batch]} (${rows.length} files)`, '', '| File | Paint | Colour | Notes |', '| --- | --- | --- | --- |')
    for (const s of rows) lines.push(`| \`${s.file}\` | ${s.what} | ${s.colour} | ${s.notes.join(' ')} |`)
    lines.push('')
  }
  await writeFile(path.join(CONTENT_DIR, 'SHOT_LIST.md'), lines.join('\n'))
  console.log(`✓ ${list.length} shots → content/avatar-kit/SHOT_LIST.md`)
}

const printIssues = (issues: CheckIssue[]) => {
  for (const i of issues) console.log(`${i.level === 'error' ? '✗' : '!'} ${i.file}: ${i.message}`)
}

/** Each race's master: from the delivery if it has one, else the last ingested one in the bucket. */
async function loadMasters(dir: string, files: { rel: string; ref: KitFileRef }[]) {
  const masters: Partial<Record<AvatarRace, Buffer>> = {}
  for (const race of AVATAR_RACES) {
    if (!files.some((f) => f.ref.race === race)) continue
    const local = files.find((f) => f.ref.race === race && f.ref.group === 'master')
    if (local) {
      masters[race] = await readFile(path.join(dir, local.rel))
      continue
    }
    try {
      const body = await getS3Client().send(new GetObjectCommand({ Bucket: DEFAULT_BUCKET, Key: `${KIT_SOURCE_PREFIX}${race}/master.png` }))
      masters[race] = Buffer.from(await body.Body!.transformToByteArray())
      console.log(`Using the ingested ${race} master from the bucket.`)
    } catch {
      console.log(`! ${race}: no master in this delivery or the bucket, so parts are used as delivered.`)
    }
  }
  return masters
}

/** Validate, align, and recolour a delivery. Returns null when there are errors. */
async function prepare(dir: string) {
  const { files, issues } = await checkKitFolder(dir)
  const pivots = await readKitPivots(dir)
  issues.push(...pivots.issues)
  if (issues.some((i) => i.level === 'error')) {
    printIssues(issues)
    return { ok: false as const, issues }
  }
  const masters = await loadMasters(dir, files)
  const prepared = await prepareKitParts(dir, files, masters)
  issues.push(...prepared.issues)
  printIssues(issues)
  for (const p of prepared.parts) if (p.notes.length) console.log(`  ${p.key}: ${p.notes.join('; ')}`)
  const errors = issues.filter((i) => i.level === 'error').length
  console.log(`${files.length} files read, ${prepared.parts.length} parts, ${errors} errors, ${issues.length - errors} warnings`)
  return { ok: errors === 0, issues, files, parts: prepared.parts, races: pivots.races }
}

async function check(dir: string): Promise<boolean> {
  const result = await prepare(dir)
  if (!result.ok) return false
  const { manifest, href } = await localKitManifest(result.parts, result.races)
  const sheet = await previewSheet(manifest, href)
  if (sheet) {
    const out = path.join(dir, '_preview.png')
    await writeFile(out, sheet)
    console.log(`Preview: ${out}`)
    const quality = await qualitySheet(manifest, href)
    if (quality) await writeFile(path.join(dir, '_quality.png'), quality)
    for (const race of AVATAR_RACES) {
      if (!isKitRaceReady(race, manifest)) continue
      const svg = buildAvatarSvg({ ...baseConfig(race, { transparentBackground: true, shellColor: 'cobalt', eyeColor: 'emerald', shellFinish: 'satin' }), backgroundMotion: 'static' }, 1024, 'portrait', `detail-${race}`, { kit: true, kitManifest: manifest, kitHref: href })
      await writeFile(path.join(dir, `_${race}-portrait.svg`), svg)
    }
  } else {
    console.log('No race has every required layer yet, so there is no preview.')
  }
  return true
}

/** Cut the new item out of an edit of the master ("the master wearing X"). */
async function extract(masterPath: string, editedPath: string, out: string) {
  const { layer, fit } = await extractAddition(masterPath, editedPath)
  await mkdir(path.dirname(out), { recursive: true })
  await writeFile(out, await rgbaToPng(layer))
  console.log(`✓ ${out} (aligned: moved ${fit.dx},${fit.dy}px, scale ${fit.scale})`)
}

async function uploadInbox(dir: string, batch: string) {
  if (!/^[a-z0-9-]{1,40}$/.test(batch)) throw new Error('--batch must be lowercase letters, digits, and dashes')
  if (!(await check(dir))) throw new Error('Fix the errors above before uploading.')
  const s3 = getS3Client()
  const pivotFiles = AVATAR_RACES.map((race) => path.join(race, 'pivots.json'))
  const rels = [...(await listImageFiles(dir)), ...(await Promise.all(pivotFiles.map(async (f) => ((await fileExists(path.join(dir, f))) ? f : null)))).filter((f): f is string => Boolean(f))]
  for (const rel of rels) {
    const Key = `${KIT_INBOX_PREFIX}${batch}/${rel.split(path.sep).join('/')}`
    const ContentType = rel.endsWith('.json') ? 'application/json' : rel.endsWith('.svg') ? 'image/svg+xml' : rel.endsWith('.webp') ? 'image/webp' : 'image/png'
    await s3.send(new PutObjectCommand({ Bucket: DEFAULT_BUCKET, Key, Body: await readFile(path.join(dir, rel)), ContentType }))
    console.log(`↑ ${Key}`)
  }
  console.log(`✓ Delivered batch "${batch}". Tell Claude: ingest avatar kit batch ${batch}.`)
}

async function downloadInbox(batch: string): Promise<string> {
  const s3 = getS3Client()
  const dir = await mkdtemp(path.join(tmpdir(), `avatar-kit-${batch}-`))
  const prefix = `${KIT_INBOX_PREFIX}${batch}/`
  let token: string | undefined
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: DEFAULT_BUCKET, Prefix: prefix, ContinuationToken: token }))
    for (const obj of page.Contents ?? []) {
      if (!obj.Key) continue
      const rel = obj.Key.slice(prefix.length)
      const out = path.join(dir, rel)
      await mkdir(path.dirname(out), { recursive: true })
      const body = await s3.send(new GetObjectCommand({ Bucket: DEFAULT_BUCKET, Key: obj.Key }))
      await writeFile(out, Buffer.from(await body.Body!.transformToByteArray()))
    }
    token = page.NextContinuationToken
  } while (token)
  return dir
}

async function ingest(dir: string, dryRun: boolean) {
  const result = await prepare(dir)
  if (!result.ok) throw new Error('Errors above; nothing ingested.')

  const manifest = await readJson<KitManifest>(MANIFEST_PATH)
  const s3 = getS3Client()
  // Keep what was delivered, so parts can be re-prepared later with better tools.
  if (!dryRun) {
    for (const { rel } of result.files) {
      const relKey = rel.split(path.sep).join('/').replace(/\.(png|webp|svg)$/i, '')
      const vector = rel.endsWith('.svg')
      await s3.send(new PutObjectCommand({ Bucket: DEFAULT_BUCKET, Key: `${KIT_SOURCE_PREFIX}${relKey}.${vector ? 'svg' : 'png'}`, Body: vector ? await readFile(path.join(dir, rel)) : await sharp(path.join(dir, rel)).png().toBuffer(), ContentType: vector ? 'image/svg+xml' : 'image/png' }))
    }
  }
  for (const part of result.parts) {
    const t = await trimKitImage(part.svg ?? part.png)
    const key = `${KIT_BUCKET_PREFIX}${part.key}.${t.hash}.${t.svg ? 'svg' : 'webp'}`
    if (!dryRun) {
      await s3.send(new PutObjectCommand({ Bucket: DEFAULT_BUCKET, Key: key, Body: t.svg ?? t.webp, ContentType: t.svg ? 'image/svg+xml' : 'image/webp', CacheControl: 'public, max-age=31536000, immutable' }))
    }
    manifest.assets[part.key] = { src: key, x: t.x, y: t.y, w: t.w, h: t.h }
    console.log(`${dryRun ? '·' : '↑'} ${key} (${((t.svg ?? t.webp).length / 1024).toFixed(0)} KB)`)
  }
  for (const [race, overrides] of Object.entries(result.races) as [AvatarRace, NonNullable<KitManifest['races'][AvatarRace]>][]) {
    manifest.races[race] = { ...manifest.races[race], pivots: { ...manifest.races[race]?.pivots, ...overrides.pivots } }
  }
  manifest.assets = Object.fromEntries(Object.entries(manifest.assets).sort(([a], [b]) => a.localeCompare(b)))
  if (!dryRun) {
    await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
    console.log(`✓ manifest.json updated (${Object.keys(manifest.assets).length} assets).`)
  }
  for (const race of AVATAR_RACES) console.log(`  ${race}: ${isKitRaceReady(race, manifest) ? 'ready, drawn with kit art' : 'not ready, keeps the vector rig'}`)
}

async function preview(out: string) {
  const manifest = await readJson<KitManifest>(MANIFEST_PATH)
  const cache = new Map<string, string>()
  const used = new Set<string>()
  // Collect, fetch, then render with embedded PNGs (librsvg cannot read webp).
  await previewSheet(manifest, (a) => {
    used.add(a.src)
    return ''
  })
  const s3 = getS3Client()
  for (const src of used) {
    const body = await s3.send(new GetObjectCommand({ Bucket: DEFAULT_BUCKET, Key: src }))
    const raw = Buffer.from(await body.Body!.transformToByteArray())
    const vector = src.endsWith('.svg')
    const image = vector ? raw : await sharp(raw).png().toBuffer()
    cache.set(src, `data:${vector ? 'image/svg+xml' : 'image/png'};base64,${image.toString('base64')}`)
  }
  const sheet = await previewSheet(manifest, (a) => cache.get(a.src) ?? '')
  if (!sheet) return console.log('No race has every required layer yet.')
  await writeFile(out, sheet)
  console.log(`✓ ${out}`)
}

async function syncAll(dryRun: boolean) {
  const { getDb } = await import('../src/db')
  const { profiles } = await import('../src/db/schema')
  const { isNotNull } = await import('drizzle-orm')
  const { syncAvatarLook } = await import('../src/lib/server/db-services')
  const db = getDb()
  const rows = await db.select({ id: profiles.id }).from(profiles).where(isNotNull(profiles.avatarConfig))
  console.log(`${rows.length} members with an avatar.`)
  if (dryRun) return
  let done = 0
  for (const row of rows) {
    await syncAvatarLook(db, row.id)
    if (++done % 25 === 0) console.log(`  ${done}/${rows.length}`)
  }
  console.log(`✓ Synced ${done} avatars.`)
}

async function main() {
  const [cmd, target] = process.argv.slice(2)
  switch (cmd) {
    case 'guides':
      return guides()
    case 'shots':
      return shots()
    case 'check':
      if (!target) throw new Error('Usage: avatar:kit -- check <dir>')
      if (!(await check(path.resolve(target)))) process.exitCode = 1
      return
    case 'upload-inbox': {
      const batch = arg('--batch')
      if (!target || !batch) throw new Error('Usage: avatar:kit -- upload-inbox <dir> --batch <name>')
      return uploadInbox(path.resolve(target), batch)
    }
    case 'ingest': {
      const inbox = arg('--inbox')
      const dir = inbox ? await downloadInbox(inbox) : target && !target.startsWith('--') ? path.resolve(target) : null
      if (!dir) throw new Error('Usage: avatar:kit -- ingest <dir> | --inbox <name>')
      return ingest(dir, flag('--dry-run'))
    }
    case 'extract': {
      const edited = process.argv[4]
      const out = arg('--out')
      if (!target || !edited || !out) throw new Error('Usage: avatar:kit -- extract <master.png> <edited.png> --out <file.png>')
      return extract(path.resolve(target), path.resolve(edited), path.resolve(out))
    }
    case 'preview':
      return preview(path.resolve(arg('--out') ?? 'avatar-kit-preview.png'))
    case 'sync-all':
      return syncAll(flag('--dry-run'))
    default:
      console.log('Commands: guides, shots, check <dir>, extract <master> <edited> --out <file>, upload-inbox <dir> --batch <name>, ingest <dir>|--inbox <name>, preview, sync-all')
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
