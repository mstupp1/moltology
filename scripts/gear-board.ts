/**
 * Gear review board: every piece asked for, worn on a plain lobster and a plain crab, laid out on
 * one contact sheet. Use it to review a new set before it ships, and to check that a refactor left
 * existing gear looking the same (`--compare`).
 *
 *   npm run gear:board                                # every base piece, front three-quarter
 *   npm run gear:board -- --collection heavy-day --views front,back
 *   npm run gear:board -- --pieces lifting-belt,taped-claws --rarity legendary
 *   npm run gear:board -- --pieces sweatband --shot close --views front,side
 *   npm run gear:board -- --pieces cream-trench --pose strut   # any character pose
 *   npm run gear:board -- --out tmp/gear-board/before
 *   npm run gear:board -- --out tmp/gear-board/after --compare tmp/gear-board/before
 *   npm run gear:board -- --collection snow-day --faces   # face check: every head shape and build
 *
 * Pieces are packed into outfits, one piece per slot, so each still shows up to seven pieces.
 * Linux draws with software WebGL, about 20 seconds a still.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { BASE_EQUIPMENT_CATALOG, VARIANT_EQUIPMENT_CATALOG } from '../src/lib/equipment-seed-data'
import { GEAR_PIECES } from '../src/lib/gear/pieces'
import { variantKey } from '../src/lib/gear-variants'
import type { EquipmentRarity } from '../src/db/schema'
import type { EquipSlotId } from '../src/lib/chassis-loadout'
import { parseLobsterAvatarConfig, LOBSTER_AVATAR_STYLE } from '../src/lib/lobster-avatar'
import { lookFromConfig } from '../src/lib/avatar3d/look'
import { SHOTS, type AnimationTimeline } from '../src/lib/avatar3d/scripted'
import { renderStills, type StillJob } from './lib/character-animation/render'
import { AVATAR_BUILDS, AVATAR_HEAD_SHAPES, type AvatarBuild, type AvatarHeadShape } from '../src/lib/avatar/traits'

const VIEWS = { front: 0.5, back: Math.PI - 0.5, side: 1.5, face: 0 } as const
type View = keyof typeof VIEWS
const SPECIES = ['lobster', 'crab'] as const
type Species = (typeof SPECIES)[number]

/** One character the outfits are tried on. */
interface Body {
  species: Species
  headShape: AvatarHeadShape
  build: AvatarBuild
  mouth: string
}

const MANNEQUINS: Body[] = SPECIES.map((species) => ({ species, headShape: 'bean', build: 'classic', mouth: 'smile' }))

/**
 * The face check: the head shape and build move the mouth and the neckline, so a garment that
 * clears the mouth on the plain mannequin can still cover it on a round-headed chunky crab. Every
 * head shape on both species, with the tongue out (the lowest mouth), across the builds.
 */
const FACE_CHECK: Body[] = SPECIES.flatMap((species) =>
  AVATAR_HEAD_SHAPES.map((headShape, i) => ({ species, headShape, build: AVATAR_BUILDS[i % AVATAR_BUILDS.length], mouth: 'tongue' })),
)

interface Args {
  pieces?: string[]
  collection?: string
  rarity?: EquipmentRarity
  views: View[]
  out: string
  size: number
  compare?: string
  force: boolean
  shot: 'wide' | 'close' | 'medium'
  pose: string
  faces: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { views: ['front'], out: 'tmp/gear-board/latest', size: 640, force: false, shot: 'wide', pose: 'rest', faces: false }
  const list = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean)
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--pieces') args.pieces = list(argv[++i])
    else if (a === '--collection') args.collection = argv[++i]
    else if (a === '--rarity') args.rarity = argv[++i] as EquipmentRarity
    else if (a === '--views') args.views = list(argv[++i]) as View[]
    else if (a === '--out') args.out = argv[++i]
    else if (a === '--size') args.size = Number(argv[++i])
    else if (a === '--compare') args.compare = argv[++i]
    else if (a === '--force') args.force = true
    else if (a === '--shot') args.shot = argv[++i] as Args['shot']
    else if (a === '--pose') args.pose = argv[++i]
    else if (a === '--faces') args.faces = true
    else throw new Error(`Unknown option ${a}`)
  }
  if (args.faces) {
    // Close and straight on, where a covered mouth shows.
    args.shot = 'close'
    if (!argv.includes('--views')) args.views = ['face']
  }
  for (const v of args.views) if (!(v in VIEWS)) throw new Error(`Unknown view "${v}" (${Object.keys(VIEWS).join(', ')})`)
  return args
}

interface Piece {
  key: string
  name: string
  slot: 'head' | 'carapace' | 'claws' | 'legs' | 'antennae' | 'belt'
}

function choosePieces(args: Args): Piece[] {
  const every = [...BASE_EQUIPMENT_CATALOG, ...VARIANT_EQUIPMENT_CATALOG].map((c) => ({
    key: c.appearanceKey ?? c.slug,
    name: c.name,
    slot: c.category,
    rarity: c.rarity,
  }))
  const byKey = new Map(every.map((p) => [p.key, p]))
  let keys: string[]
  if (args.collection) {
    keys = GEAR_PIECES.filter((p) => p.collection === args.collection).map((p) => p.key)
    if (!keys.length) throw new Error(`No pieces in collection "${args.collection}"`)
  } else if (args.pieces) keys = args.pieces
  else keys = BASE_EQUIPMENT_CATALOG.map((c) => c.appearanceKey ?? c.slug)
  return keys.map((k) => {
    const key = args.rarity && args.rarity !== 'common' && byKey.has(variantKey(k, args.rarity)) ? variantKey(k, args.rarity) : k
    const p = byKey.get(key)
    if (!p) throw new Error(`No piece "${key}"`)
    return { key, name: p.name, slot: p.slot }
  })
}

/** Greedy packing: each outfit takes the next unused piece for every slot (two for claws). */
function packOutfits(pieces: Piece[]): Partial<Record<EquipSlotId, Piece>>[] {
  const queues = new Map<string, Piece[]>()
  for (const p of pieces) queues.set(p.slot, [...(queues.get(p.slot) ?? []), p])
  const outfits: Partial<Record<EquipSlotId, Piece>>[] = []
  while ([...queues.values()].some((q) => q.length)) {
    const outfit: Partial<Record<EquipSlotId, Piece>> = {}
    for (const [slot, q] of queues) {
      if (slot === 'claws') {
        const left = q.shift()
        if (left) outfit['claws-1'] = left
        const right = q.shift()
        if (right) outfit['claws-2'] = right
      } else {
        const next = q.shift()
        if (next) outfit[slot as EquipSlotId] = next
      }
    }
    outfits.push(outfit)
  }
  return outfits
}

function timeline(body: Body, outfit: Partial<Record<EquipSlotId, Piece>>, yaw: number, size: number, shot: Args['shot'], pose: string): AnimationTimeline {
  const equipment = Object.fromEntries(Object.entries(outfit).map(([slot, p]) => [slot, { visualKey: p!.key, rarity: 'common' }]))
  const config = parseLobsterAvatarConfig({
    style: LOBSTER_AVATAR_STYLE,
    seed: `gear-board-${body.species}`,
    race: body.species,
    shellColor: body.species === 'lobster' ? 'coral' : 'lagoon',
    shellFinish: 'satin',
    marking: 'none',
    pose,
    headShape: body.headShape,
    build: body.build,
    eyelidStyle: 'relaxed',
    mouth: body.mouth,
    antennae: 'whip',
    equipment,
  })
  if (!config) throw new Error('Mannequin config is invalid')
  return {
    width: size,
    height: size,
    fps: 30,
    frames: 18,
    look: lookFromConfig(config),
    cues: [{ t: 0, camera: shot === 'wide' ? { ...SHOTS.wide, zoom: 0.8, pan: 0, cut: true } : { ...SHOTS[shot], pan: 0, cut: true }, yaw, look: { x: 0, y: 0 } }],
    talk: [],
    lighting: 'studio',
  }
}

/** Share of pixels whose colour moved more than a small threshold. */
async function difference(a: string, b: string): Promise<number> {
  const [ia, ib] = await Promise.all([loadImage(a), loadImage(b)])
  if (ia.width !== ib.width || ia.height !== ib.height) return 1
  const read = (img: typeof ia) => {
    const c = createCanvas(img.width, img.height)
    c.getContext('2d').drawImage(img, 0, 0)
    return c.getContext('2d').getImageData(0, 0, img.width, img.height).data
  }
  const da = read(ia)
  const db = read(ib)
  let changed = 0
  for (let i = 0; i < da.length; i += 4) {
    const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) + Math.abs(da[i + 3] - db[i + 3])
    if (d > 24) changed++
  }
  return changed / (da.length / 4)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const pieces = choosePieces(args)
  const outfits = packOutfits(pieces)
  const dir = path.resolve(args.out)
  const jobs: StillJob[] = []
  const bodies = args.faces ? FACE_CHECK : MANNEQUINS
  const grid: { label: string; files: string[] }[] = []
  outfits.forEach((outfit, i) => {
    const files: string[] = []
    for (const body of bodies) {
      for (const view of args.views) {
        const who = args.faces ? `${body.species}-${body.headShape}-${body.build}` : body.species
        const out = path.join(dir, `outfit-${String(i + 1).padStart(2, '0')}-${who}-${view}.png`)
        files.push(out)
        if (args.force || !fs.existsSync(out)) jobs.push({ timeline: timeline(body, outfit, VIEWS[view], args.size, args.shot, args.pose), out, shadows: false })
      }
    }
    grid.push({ label: Object.values(outfit).map((p) => p!.name).join(' · '), files })
  })
  console.log(`${pieces.length} pieces in ${outfits.length} outfits, ${jobs.length} stills to draw`)
  await renderStills(jobs, (job, s) => console.log(`  ${path.relative(process.cwd(), job.out)} (${s.toFixed(1)}s)`))

  // Contact sheet: one row per outfit, lobster then crab, each view.
  const tile = Math.round(args.size * 0.5)
  const pad = 16
  const labelH = 40
  const cols = bodies.length * args.views.length
  const W = pad + cols * (tile + pad)
  const H = pad + grid.length * (tile + labelH + pad)
  const c = createCanvas(W, H)
  const g = c.getContext('2d')
  g.fillStyle = '#dfe4ec'
  g.fillRect(0, 0, W, H)
  for (const [r, row] of grid.entries()) {
    const y = pad + r * (tile + labelH + pad)
    g.fillStyle = '#0b1424'
    g.font = '600 18px sans-serif'
    g.fillText(row.label, pad, y + 24, W - pad * 2)
    for (const [k, file] of row.files.entries()) g.drawImage(await loadImage(file), pad + k * (tile + pad), y + labelH, tile, tile)
  }
  const sheet = path.join(dir, 'board.png')
  fs.writeFileSync(sheet, c.toBuffer('image/png'))
  console.log(`\nBoard: ${path.relative(process.cwd(), sheet)}`)

  if (args.compare) {
    let worst = 0
    for (const row of grid) {
      for (const file of row.files) {
        const before = path.join(path.resolve(args.compare), path.basename(file))
        if (!fs.existsSync(before)) {
          console.log(`  no earlier still for ${path.basename(file)}`)
          continue
        }
        const share = await difference(before, file)
        worst = Math.max(worst, share)
        if (share > 0.002) console.log(`  CHANGED ${path.basename(file)}: ${(share * 100).toFixed(2)}% of pixels`)
      }
    }
    console.log(`Compare: largest change ${(worst * 100).toFixed(3)}% of pixels`)
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
