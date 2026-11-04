/** Worn geometry and inventory art share this registry. Never use inventory photographs as overlays. */
import type { EquipmentCategory } from '../../db/schema'
import { cubicAt, outlineHalfAt, type Pt } from './geometry'
import { renderAccessory } from './parts'
import { ids, paintDefs, type PaintContext } from './paint'
import { SHELL_PALETTES, type AvatarAccessory } from './traits'
import { TIER_FINISH, mixHex, parseVariantKey } from '../gear-variants'

export interface EquipmentVisual {
  key: string
  category: EquipmentCategory
  material: string
  trim: string
  accent: string
  construction: number
  motif: 'plate' | 'rib' | 'vent' | 'crown' | 'hammer' | 'crusher' | 'slim' | 'mitten' | 'sensor'
  accessory?: AvatarAccessory
}
const rows: Array<
  [
    string,
    EquipmentCategory,
    string,
    string,
    string,
    number,
    EquipmentVisual['motif'],
    AvatarAccessory?,
  ]
> = [
  ['larval-plate-vest', 'carapace', '#2f6f73', '#c9b37a', '#8ff0e0', 0, 'plate'],
  ['tide-braced-carapace', 'carapace', '#345765', '#93b5b8', '#8bd7d2', 1, 'rib'],
  ['abyssal-ward-shell', 'carapace', '#34394f', '#a99bc9', '#c7a4ff', 3, 'plate'],
  ['hydrostatic-seal-plate', 'carapace', '#162c38', '#c99f54', '#85f0e0', 4, 'vent'],
  ['training-pincers', 'claws', '#356f6c', '#c9b37a', '#8ff0e0', 0, 'plate'],
  ['hydraulic-crush-claws', 'claws', '#3d5961', '#a9bfc5', '#61dddf', 2, 'crusher'],
  ['synapse-shear-claws', 'claws', '#25354a', '#e3b765', '#87f5f3', 4, 'slim'],
  ['silt-maul', 'claws', '#66594d', '#b3a68a', '#dfc998', 1, 'hammer'],
  ['tideforge-hammer', 'claws', '#314958', '#a2c2c7', '#86e2ed', 2, 'hammer'],
  ['soft-shell-visor', 'head', '#2b5f6b', '#c9b37a', '#8ff0e0', 0, 'plate', 'visor'],
  ['architect-crown-plate', 'head', '#3f5e68', '#c1b08b', '#9ce1e5', 2, 'crown'],
  ['oracle-dome-lattice', 'head', '#243448', '#d3b46b', '#b8a9ff', 4, 'crown'],
  ['silt-walker-greaves', 'legs', '#2f6a66', '#c9b37a', '#8ff0e0', 0, 'plate'],
  ['current-cutter-legs', 'legs', '#355b64', '#9fc5bf', '#8ce0d4', 1, 'vent'],
  ['void-stride-articulation', 'legs', '#302d48', '#a8a1cd', '#c5aeff', 3, 'rib'],
  ['larval-feelers', 'antennae', '#3b706a', '#c9b37a', '#a5f2df', 0, 'sensor'],
  ['depth-sense-antennae', 'antennae', '#3e625f', '#a2bda3', '#a1e8d7', 1, 'sensor'],
  ['benthic-radar-array', 'antennae', '#344f62', '#9db9ce', '#85d9ff', 2, 'sensor'],
  ['ascendant-signal-crown', 'antennae', '#433b4f', '#c2a9cf', '#edb7ff', 3, 'crown'],
  ['larval-chitin-cincture', 'belt', '#7a5a3a', '#c9b37a', '#e9d9a6', 0, 'plate'],
  ['silt-tension-vent-sash', 'belt', '#485b5a', '#a1b7a2', '#b3dbcf', 1, 'vent'],
  ['abyssal-clasp-girdle', 'belt', '#2b4657', '#a3b8c3', '#93e0ef', 2, 'rib'],
  ['hydrostatic-girdle-lattice', 'belt', '#343c53', '#b3a7cc', '#b5c0ff', 3, 'rib'],
  ['core-lock-vent-harness', 'belt', '#243b40', '#dbb267', '#87f0d6', 4, 'vent'],
  ['creator-hard-hat', 'head', '#e8b751', '#f6da99', '#a3e1db', 0, 'plate', 'hard_hat'],
  ['creator-crown', 'head', '#c99e45', '#f7df93', '#d25f69', 0, 'crown', 'crown'],
  ['creator-headset', 'head', '#324c59', '#9db3c3', '#8be8e0', 0, 'plate', 'headset'],
  ['creator-halo', 'head', '#d7ba6c', '#fff2b4', '#c7f6e4', 0, 'crown', 'halo'],
  ['creator-bow', 'head', '#ce6385', '#ffb4c7', '#f1d4df', 0, 'plate', 'bow'],
  ['creator-beanie', 'head', '#4e8996', '#aad5d5', '#e89d82', 0, 'rib', 'beanie'],
  ['creator-crusher', 'claws', '#7b6050', '#dbb78d', '#dfc9a4', 0, 'crusher'],
  ['creator-slim', 'claws', '#4d6e7b', '#b3d0d5', '#9adfe6', 0, 'slim'],
  ['creator-mitten', 'claws', '#966b83', '#d9b2c1', '#f5cfdf', 0, 'mitten'],
]
export const EQUIPMENT_VISUALS: Readonly<Record<string, EquipmentVisual>> = Object.fromEntries(
  rows.map(([key, category, material, trim, accent, construction, motif, accessory]) => [
    key,
    { key, category, material, trim, accent, construction, motif, accessory },
  ]),
)
const variantVisuals = new Map<string, EquipmentVisual | undefined>()

/** Base pieces come from the table above; `<key>--<rarity>` variants are recoloured from their base. */
export function getEquipmentVisual(key: string): EquipmentVisual | undefined {
  const direct = EQUIPMENT_VISUALS[key]
  if (direct) return direct
  if (variantVisuals.has(key)) return variantVisuals.get(key)
  const { baseKey, rarity } = parseVariantKey(key)
  const base = rarity && rarity !== 'common' ? EQUIPMENT_VISUALS[baseKey] : undefined
  const finish = rarity && rarity !== 'common' ? TIER_FINISH[rarity] : undefined
  const visual =
    base && finish
      ? {
          ...base,
          key: key.replace(/[^a-z0-9-]/gi, '-'),
          material: mixHex(base.material, finish.hue, finish.pull),
          trim: finish.trim,
          accent: finish.accent,
          construction: Math.max(base.construction, finish.construction),
        }
      : undefined
  variantVisuals.set(key, visual)
  return visual
}

/** Mix a hex colour toward black (f < 0) or white (f > 0). */
export function tone(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(f < 0 ? c * (1 + f) : c + (255 - c) * f),
  )
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

export interface EquipmentFit {
  race?: 'lobster' | 'crab'
  torsoW?: number
  torsoH?: number
  eyeY?: number
  mouthY?: number
  antennaRoots?: [[number, number], [number, number]]
  /** Leg gear is built over the wearer's own leg outline instead of a stock shape. */
  leg?: LegFrame
  /** The wearer's claw outline (claw-local), so gauntlets wrap the real claw. */
  claw?: { palm: string; finger: string }
  /** Half-width of the wearer's waist at the belt line. */
  waistHalf?: number
  /** The wearer's own antenna (left-side local frame), so feeler gear rides it instead of replacing it. */
  antenna?: { stalk: [Pt, Pt, Pt, Pt]; tip: Pt; scale: number }
  /** The wearer's torso outline (absolute) and the band a chest plate covers. */
  torso?: { path: string; top: number; bottom: number }
}

/**
 * One leg as the race draws it. Armour is the limb's own outline, puffed out a
 * little, so it always matches the leg's width, bend and foot.
 */
export interface LegFrame {
  thigh: string
  shin: string
  foot: string
  /** Point the thigh and shin plates swell from. */
  thighAt: Pt
  shinAt: Pt
  /** Bottom centre of the foot; the boot grows from here so it stays on the ground. */
  sole: Pt
  knee: Pt
  kneeR: number
  ankle: Pt
  /** +1 when the outside of the leg is toward +x. */
  outward: 1 | -1
}

/** Where each hat's band sits against the brim line (local y = 0). */
const ACCESSORY_TOP: Partial<Record<AvatarAccessory, number>> = {
  hard_hat: -8,
  beanie: -7,
  crown: -2,
  halo: -3,
  bow: -1,
}

/** Local coordinates: torso 0..60, head centred at y=0, weapon cuff at y=0. */
export function renderEquipment(
  key: string,
  ctx: PaintContext,
  fit?: EquipmentFit,
): string {
  const v = getEquipmentVisual(key)
  if (!v) return ''
  const uid = `${ctx.uid}-eq-${v.key}`,
    n = v.construction
  const line = tone(v.material, -0.62)
  const plate = (d: string, fill = `url(#${uid})`) =>
    `<path d="${d}" fill="${fill}" stroke="${line}" stroke-width="1.1" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${tone(v.trim, 0.45)}" stroke-width="0.65" opacity=".55" transform="translate(0 -.5)"/>`
  const bolts = (xs: number[], y: number) =>
    xs
      .map(
        (x) =>
          `<circle cx="${x}" cy="${y}" r="1.25" fill="${v.trim}" stroke="#203238" stroke-width=".5"/>`,
      )
      .join('')
  const seam = (d: string) =>
    `<path d="${d}" fill="none" stroke="${v.accent}" stroke-width="${n > 2 ? 1.3 : 0.7}" opacity=".9"/>`
  let body = ''
  if (v.accessory) {
    body = renderAccessory(
      v.accessory,
      { ...ctx, uid, rim: v.accent },
      { x: 0, top: ACCESSORY_TOP[v.accessory] ?? 0, eyeY: fit?.eyeY ?? 15, mouth: [0, fit?.mouthY ?? 40] },
    )
  } else if (v.category === 'carapace' && fit?.race === 'crab') {
    const w = (fit.torsoW ?? 101) / 2
    const h = fit.torsoH ?? 69
    // Dorsal wings follow the shell edge. The fixed ventral plate clears even
    // an open grin; expression never stretches, shifts, or resizes the armor.
    const vent = (fit.mouthY ?? 38) + 22
    // Edge guards ride the shell's outer rim, clear of the eyes, so the face stays open.
    const x0 = Math.max(w - 20, 29)
    body = `<g data-armor-fit="crab">`
    for (const side of [-1, 1]) body += `<g transform="scale(${side} 1)">${plate(`M${x0},14 Q${w - 6},10 ${w - 1},22 L${w + 2},36 L${w - 5},${h - 9} L${w - 15},${h - 13} L${x0 + 4},31 Z`)}${seam(`M${x0 + 4},17 Q${w - 6},16 ${w - 4},30 L${w - 10},${h - 16}`)}${bolts([w - 8], 26)}</g>`
    body += plate(`M-20,${vent} Q0,${vent + 5} 20,${vent} L17,${vent + 15} Q0,${vent + 24} -17,${vent + 15} Z`) + seam(`M-12,${vent + 9} Q0,${vent + 13} 12,${vent + 9}`) + '</g>'
  } else if (v.category === 'carapace' && !fit?.torso) {
    body = `<path d="M-30,3 Q0,-4 30,3 L20,49 Q0,64 -20,49 Z" fill="#07171d" opacity=".25" transform="translate(0 2)"/>` +
      plate('M-29,1 Q-15,-5 0,4 Q15,-5 29,1 L23,25 L18,47 Q0,60 -18,47 L-23,25 Z') +
      plate('M-25,6 L-9,12 L-5,34 L-17,29 Z', v.material) +
      plate('M25,6 L9,12 L5,34 L17,29 Z', v.material) +
      plate(`M-5,8 L0,${-n} L5,8 L5,39 L0,47 L-5,39 Z`, v.trim) +
      [0, 1, 2]
        .map((i) =>
          seam(`M-22,${19 + i * 10} L-10,${24 + i * 10} M22,${19 + i * 10} L10,${24 + i * 10}`),
        )
        .join('') +
      bolts([-23, 23], 7)
    if (n > 0)
      body +=
        plate(`M-28,0 L-36,${-n * 2} L-38,${9 + n * 2} L-25,17 Z`) +
        plate(`M28,0 L36,${-n * 2} L38,${9 + n * 2} L25,17 Z`)
  } else if (v.category === 'belt') {
    // The band spans the wearer's real waist; buckle and fittings ride its ends.
    const h = fit?.waistHalf ?? 27
    const e = (x: number) => (x < 0 ? x - (h - 27) : x + (h - 27))
    body =
      plate(`M${-h},-5 Q0,1 ${h},-5 L${h - 1},7 Q0,14 ${-(h - 1)},7 Z`) +
      plate(`M-${6 + n},-4 L${6 + n},-4 L${8 + n},8 L0,${13 + n} L-${8 + n},8 Z`, v.trim) +
      bolts([e(-21), e(21)], 2)
    if (v.motif === 'vent') body += [-17, -12, 12, 17].map((x) => seam(`M${e(x)},0 v5`)).join('')
  } else if (v.category === 'carapace' && fit?.torso) {
    body = torsoArmour(v, uid, fit.torso, plate, seam, bolts)
  } else if (v.category === 'legs' && fit?.leg) {
    body = legArmour(v, uid, fit.leg, plate, seam)
  } else if (v.category === 'legs') {
    body =
      plate(`M-8,-2 L8,-2 L${10 + n},17 L6,29 L-6,29 L-${10 + n},17 Z`) +
      plate('M-6,27 L6,27 L9,45 L-9,45 Z') +
      plate('M-9,41 L8,41 L14,48 L-13,48 L-14,46 Z', v.material) +
      seam('M-5,8 L0,13 L5,8 M-4,32 H4')
  } else if (v.category === 'antennae' && fit?.antenna) {
    body = antennaGear(v, fit.antenna, plate)
  } else if (v.category === 'antennae') {
    body = ''
    for (const [i, side] of [-1, 1].entries()) {
      const root = fit?.antennaRoots?.[i] ?? [side * 5, 0]
      const name = i === 0 ? 'left' : 'right'
      const tip = 25 + n * 3
      body += `<g transform="translate(${root[0]} ${root[1]}) scale(${side} 1)"><circle r="3.2" fill="${v.material}" stroke="${v.trim}" stroke-width="1"/><g class="lobster-idle-layer lobster-idle-antenna-${name}"><path d="M0,0 Q${8 + n * 3},${-22 - n * 4} ${tip},${-25 - n * 5}" fill="none" stroke="#152930" stroke-width="4.5" stroke-linecap="round"/><path d="M0,0 Q${8 + n * 3},${-22 - n * 4} ${tip},${-25 - n * 5}" fill="none" stroke="${v.trim}" stroke-width="2.5" stroke-linecap="round"/><circle cx="${tip}" cy="${-25 - n * 5}" r="${2 + n}" fill="${v.accent}"/></g></g>`
    }
  } else if (v.category === 'head') {
    body =
      plate(
        `M-30,7 L-24,-9 L-12,-${15 + n * 2} L0,-${9 + n * 4} L12,-${15 + n * 2} L24,-9 L30,7 L21,13 L18,3 L-18,3 L-21,13 Z`,
      ) +
      plate('M-18,3 L-14,-6 L0,-1 L14,-6 L18,3 Z', v.trim) +
      seam('M-12,-5 L0,-9 L12,-5') +
      bolts([-25, 25], 4)
  } else if (v.category === 'claws' && v.motif !== 'hammer' && fit?.claw) {
    body = clawArmour(v, uid, fit.claw, plate, seam, bolts)
  } else if (v.motif === 'hammer') {
    body =
      `<path d="M-3,5 L1,-67" stroke="#18272a" stroke-width="7"/><path d="M-3,5 L1,-67" stroke="${v.trim}" stroke-width="4"/>` +
      plate(
        `M-22,-${65 + n * 2} L-17,-${78 + n * 3} L22,-${76 + n * 3} L26,-61 L19,-51 L-18,-53 Z`,
      ) +
      plate('M-8,-76 L8,-76 L8,-53 L-8,-53 Z', v.trim) +
      seam('M-19,-65 H-11 M12,-63 H21')
  } else {
    const w = v.motif === 'crusher' ? 24 : v.motif === 'slim' ? 13 : 19
    const h = v.motif === 'mitten' ? 25 : v.motif === 'slim' ? 48 : 37
    body =
      plate(
        `M-8,3 C-${w},-5 -${w + 5},-${h - 9} -${w - 3},-${h} L-6,-${h - 7} L-5,-16 L3,-18 L9,-${h + 5} C${w + 10},-${h - 1} ${w + 6},-4 8,3 Z`,
      ) +
      plate('M-10,0 Q0,-4 10,0 L10,7 Q0,11 -10,7 Z', v.trim) +
      seam(`M-${w - 5},-12 Q-${w},-${h - 12} -${w - 5},-${h - 8}`) +
      bolts([-5, 5], 4)
    if (n > 0)
      body += plate(
        `M-${w - 1},-13 L-${w + 5},-21 L-${w + 2},-${h - 3} L-${w - 4},-${h - 7} Z`,
        v.trim,
      )
  }
  // Construction changes shape and assembly, rather than only tinting a shared silhouette.
  if (!v.accessory && v.category === 'carapace' && fit?.race !== 'crab' && !fit?.torso && n >= 2) {
    body += [-1, 1]
      .map(
        (side) =>
          `<g transform="scale(${side} 1)">${plate('M18,12 L29,9 L26,25 L17,32 Z')}${plate('M17,30 L26,24 L24,40 L13,48 Z')}${seam('M21,16 L23,20 M18,36 L21,33')}</g>`,
      )
      .join('')
    if (n === 4)
      body += [-1, 1]
        .map(
          (side) =>
            `<g transform="scale(${side} 1)">${plate('M28,2 L36,-14 L40,-5 L37,20 L29,12 Z', v.trim)}${plate('M24,40 L29,38 L24,53 L12,58 L14,49 Z')}${seam('M31,1 L35,-6 L35,10')}</g>`,
        )
        .join('')
  }
  if (!v.accessory && v.category === 'head' && n >= 2) {
    body += [-1, 1]
      .map(
        (side) =>
          `<g transform="scale(${side} 1)">${plate(n === 4 ? 'M19,-9 L25,-23 L33,-15 L30,0 L25,9 L23,-2 Z' : 'M22,-8 L29,-14 L32,-1 L27,6 Z')}${seam('M26,-8 V0')}</g>`,
      )
      .join('')
    if (n === 4) body += plate('M-8,-20 L0,-32 L8,-20 L5,-8 L-5,-8 Z', v.trim) + seam('M0,-26 V-13')
  }
  if (v.category === 'legs' && n > 0 && !fit?.leg) {
    body += plate(n > 2 ? 'M7,5 L15,-5 L16,16 L9,26 L5,21 Z' : 'M7,7 L12,2 L12,17 L7,22 Z')
    body += (n > 2 ? [0, 1, 2] : [0, 1])
      .map((i) => seam(`M-5,${15 + i * 4} L0,${18 + i * 4} L5,${15 + i * 4}`))
      .join('')
    if (n > 2) body += plate('M-9,37 L-15,41 L-15,49 L-9,47 Z', v.trim)
  }
  if (v.category === 'belt' && n >= 2) {
    body += [-1, 1]
      .map(
        (side) =>
          `<g transform="scale(${side} 1) translate(${(fit?.waistHalf ?? 27) - 27} 0)">${plate(n === 4 ? 'M12,-4 L23,-10 L28,-3 L25,14 L16,18 L15,7 Z' : 'M15,-3 L25,-1 L24,12 L16,15 Z')}${seam(n === 4 ? 'M19,-2 V10 M23,-2 V8' : 'M19,1 V8')}</g>`,
      )
      .join('')
    if (n === 3) body += seam('M-12,-3 L0,7 L12,-3 M-9,-3 L0,3 L9,-3')
  }
  if (v.motif === 'hammer' && n >= 2) {
    body +=
      plate('M-22,-69 L-27,-65 L-25,-52 L-18,-53 Z', v.trim) +
      plate('M22,-72 L29,-66 L28,-57 L23,-56 Z', v.trim)
    body +=
      bolts([-15, 16], -63) +
      '<path d="M-1,-43 l4,0 M-2,-35 l4,0 M-2,-27 l4,0" stroke="' +
      v.material +
      '" stroke-width="3"/>'
  }
  if (n > 1 && !fit?.leg && !fit?.torso && !fit?.antenna && !(fit?.claw && v.category === 'claws'))
    body += `<g fill="${v.accent}">${[0, 1, 2].map((i) => `<circle cx="${(i - 1) * 4}" cy="${v.category === 'claws' ? -8 : 3}" r=".8"/>`).join('')}</g>`
  if (n === 4 && !fit?.leg && !fit?.torso && !fit?.antenna && !(fit?.claw && v.category === 'claws'))
    body += `<g class="equipment-signature" fill="none" stroke="${v.accent}" stroke-width=".65" opacity=".7">${v.category === 'claws' ? '<path d="M-14,-20 l3,-8 M10,-25 l3,-8"/>' : '<path d="M-12,10 L0,16 L12,10 M-9,14 L0,20 L9,14"/>'}</g>`
  // Held weapons slide up so the shaft runs through the claw's pinch and the head clears the tip.
  if (v.motif === 'hammer' && fit?.claw) body = `<g data-weapon-grip="pinch" transform="translate(3 -16) scale(0.85)">${body}</g>`
  // Helmets are drawn with their band at y=3; lift it just clear of the brows on the brim line.
  if (v.category === 'head' && !v.accessory) body = `<g transform="translate(0 -5)">${body}</g>`
  return `<g data-equipment="${v.key}" data-construction="${n}"><defs><linearGradient id="${uid}" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="${v.trim}"/><stop offset=".2" stop-color="${v.material}"/><stop offset=".32" stop-color="${v.trim}" stop-opacity=".65"/><stop offset=".65" stop-color="${v.material}"/><stop offset="1" stop-color="${tone(v.material, -0.5)}"/></linearGradient></defs><g filter="url(#${ids(ctx).gearForm})">${body}</g></g>`
}

export function equipmentThumbnail(key: string): string | null {
  const v = getEquipmentVisual(key)
  if (!v) return null
  const ctx: PaintContext = {
    uid: 'inventory',
    palette: SHELL_PALETTES[0],
    partner: null,
    finish: 'satin',
    marking: 'none',
    rim: v.accent,
  }
  const boxes: Record<EquipmentCategory, string> = {
    head: '-46 -50 92 110',
    carapace: '-45 -15 90 90',
    claws: '-40 -90 80 110',
    legs: '-26 -8 52 65',
    antennae: '-52 -60 104 80',
    belt: '-36 -26 72 72',
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${boxes[v.category]}"><defs>${paintDefs(ctx)}</defs>${renderEquipment(key, ctx)}</svg>`)}`
}

type PlateFn = (d: string, fill?: string) => string

/** Greaves, knee cop, thigh guard and boot, each the wearer's own leg part puffed out a little. */
function legArmour(v: EquipmentVisual, uid: string, leg: LegFrame, plate: PlateFn, seam: (d: string) => string): string {
  const n = v.construction
  const p = (q: Pt) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`
  const swell = (d: string, at: Pt, k: number, fill?: string) =>
    `<g transform="translate(${p(at)}) scale(${k}) translate(${p([-at[0], -at[1]])})">${plate(d, fill)}</g>`
  // Lines across a plate, clipped to it, so the detail follows any leg shape.
  const bands = (id: string, d: string, at: Pt, k: number, ys: number[], stroke: string, w: number) =>
    `<clipPath id="${uid}-${id}"><path d="${d}" transform="translate(${p(at)}) scale(${k}) translate(${p([-at[0], -at[1]])})"/></clipPath>` +
    `<g clip-path="url(#${uid}-${id})" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round">${ys
      .map((y) => `<path d="M${(at[0] - 30).toFixed(2)},${y.toFixed(2)} H${(at[0] + 30).toFixed(2)}"/>`)
      .join('')}</g>`
  const [kx, ky] = leg.knee
  const [ax, ay] = leg.ankle
  const shinLen = ay - ky
  let out = ''
  // Thigh guard from the first upgrade on.
  if (n >= 1) {
    out += swell(leg.thigh, leg.thighAt, 1.1)
    if (v.motif === 'rib') out += bands('thigh', leg.thigh, leg.thighAt, 1.1, [0.3, 0.55, 0.8].map((f) => leg.thighAt[1] + (ky - leg.thighAt[1]) * (f * 2 - 1) * 0.9), tone(v.material, -0.55), 1.1)
  }
  out += swell(leg.shin, leg.shinAt, 1.14)
  if (v.motif === 'vent') out += bands('shin', leg.shin, leg.shinAt, 1.14, [0.3, 0.45, 0.6].map((f) => ky + shinLen * f), v.accent, 1.2)
  else if (v.motif === 'rib') out += bands('shin', leg.shin, leg.shinAt, 1.14, [0.3, 0.55, 0.8].map((f) => ky + shinLen * f), tone(v.material, -0.55), 1.1)
  else out += seam(`M${kx.toFixed(2)},${(ky + 4).toFixed(2)} L${ax.toFixed(2)},${(ay - 3).toFixed(2)}`)
  // Boot: the foot itself, grown from the sole so it never lifts off the ground.
  out += swell(leg.foot, leg.sole, 1.08, v.material)
  // Knee cop: a domed plate with a trim ridge, rather than a flat disc.
  const r = leg.kneeR * 0.88
  out += plate(`M${(kx - r).toFixed(2)},${(ky + 1).toFixed(2)} Q${(kx - r).toFixed(2)},${(ky - r * 0.9).toFixed(2)} ${kx.toFixed(2)},${(ky - r * 0.9).toFixed(2)} Q${(kx + r).toFixed(2)},${(ky - r * 0.9).toFixed(2)} ${(kx + r).toFixed(2)},${(ky + 1).toFixed(2)} Q${kx.toFixed(2)},${(ky + r * 0.75).toFixed(2)} ${(kx - r).toFixed(2)},${(ky + 1).toFixed(2)} Z`)
  out += `<path d="M${(kx - r * 0.6).toFixed(2)},${(ky - 0.5).toFixed(2)} Q${kx.toFixed(2)},${(ky - r * 0.55).toFixed(2)} ${(kx + r * 0.6).toFixed(2)},${(ky - 0.5).toFixed(2)}" fill="none" stroke="${v.trim}" stroke-width="1" stroke-linecap="round"/>`
  if (n > 2) {
    const o = leg.outward
    const fx = kx + o * leg.kneeR * 0.7
    out += plate(`M${fx.toFixed(2)},${(ky - 3).toFixed(2)} L${(fx + o * 6).toFixed(2)},${(ky - 7).toFixed(2)} L${(fx + o * 3).toFixed(2)},${(ky + 4).toFixed(2)} Z`, v.trim)
  }
  return `<g data-leg-armour="fit">${out}</g>`
}

/** Gauntlet plates over the claw's own palm and finger, so every claw style keeps its silhouette. */
function clawArmour(
  v: EquipmentVisual,
  uid: string,
  claw: { palm: string; finger: string },
  plate: PlateFn,
  seam: (d: string) => string,
  bolts: (xs: number[], y: number) => string,
): string {
  const n = v.construction
  const swell = (d: string, at: Pt, k: number, fill?: string) =>
    `<g transform="translate(${at[0]} ${at[1]}) scale(${k}) translate(${-at[0]} ${-at[1]})">${plate(d, fill)}</g>`
  const palmAt: Pt = [-5, -24]
  const fingerAt: Pt = [7, -44]
  const clip = `<clipPath id="${uid}-palm"><path d="${claw.palm}" transform="translate(-5 -24) scale(1.08) translate(5 24)"/></clipPath>`
  const bands = (ys: number[], stroke: string) =>
    `<g clip-path="url(#${uid}-palm)" fill="none" stroke="${stroke}" stroke-width="1.2">${ys.map((y) => `<path d="M-30,${y} Q-5,${y - 4} 20,${y}"/>`).join('')}</g>`
  let out = clip
  if (v.motif === 'crusher') {
    out += swell(claw.finger, fingerAt, 1.12) + swell(claw.palm, palmAt, 1.1)
    out += bolts([-14], -14) + bolts([-16], -26) + bolts([-14], -38)
    out += bands([-8, -46], tone(v.material, -0.55))
  } else if (v.motif === 'slim') {
    out += swell(claw.finger, fingerAt, 1.06, v.trim) + swell(claw.palm, palmAt, 1.06)
    // A blade along the finger's outer edge.
    out += plate('M12,-30 C18,-40 16,-56 5,-68 L3,-61 C9,-52 10,-41 6,-33 Z', v.trim)
    out += seam('M-14,-12 C-15,-24 -12,-38 -7,-46')
  } else if (v.motif === 'mitten') {
    // One padded cover over palm and finger: soft, no rivets.
    out += swell(claw.finger, fingerAt, 1.16, v.material) + swell(claw.palm, palmAt, 1.14, v.material)
    out += `<path d="M-15,-10 C-17,-24 -14,-40 -6,-50" fill="none" stroke="${v.trim}" stroke-width="1" stroke-dasharray="2 2" stroke-linecap="round"/>`
  } else {
    out += swell(claw.palm, palmAt, 1.08)
    out += seam('M-13,-12 C-14,-24 -11,-36 -6,-44')
  }
  if (n >= 1 && v.motif !== 'mitten') out += bands(n >= 3 ? [-12, -22, -32] : [-14, -26], v.accent)
  // Wrist cuff where the claw meets the arm.
  out += plate('M-11,-1 Q0,-5 11,-1 L10,6 Q0,10 -10,6 Z', v.trim) + bolts([-5, 5], 3)
  return `<g data-claw-armour="fit">${out}</g>`
}

/** A chest plate cut from the wearer's own torso outline, so it wraps every build. */
function torsoArmour(
  v: EquipmentVisual,
  uid: string,
  torso: { path: string; top: number; bottom: number },
  plate: PlateFn,
  seam: (d: string) => string,
  bolts: (xs: number[], y: number) => string,
): string {
  const n = v.construction
  const { top, bottom } = torso
  const mid = (top + bottom) / 2
  const halfAt = (y: number) => outlineHalfAt(torso.path, y) * 1.05
  const grow = `translate(50 ${mid}) scale(1.05) translate(-50 ${-mid})`
  const band = `M-10,${top} L110,${top} L110,${bottom - 6} Q50,${bottom + 8} -10,${bottom - 6} Z`
  const clip = `<clipPath id="${uid}-band"><path d="${band}"/></clipPath><clipPath id="${uid}-torso"><path d="${torso.path}" transform="${grow}"/></clipPath>`
  const inside = (inner: string) => `<g clip-path="url(#${uid}-torso)">${inner}</g>`
  let out = clip + `<g clip-path="url(#${uid}-band)"><g transform="${grow}">${plate(torso.path)}</g></g>`
  // Lower edge of the plate, drawn along the cut.
  out += inside(`<path d="M-10,${bottom - 6} Q50,${bottom + 8} 110,${bottom - 6}" fill="none" stroke="${tone(v.material, -0.62)}" stroke-width="1.2"/><path d="M-10,${bottom - 7.5} Q50,${bottom + 6.5} 110,${bottom - 7.5}" fill="none" stroke="${tone(v.trim, 0.45)}" stroke-width=".7" opacity=".6"/>`)
  // Centre keel in trim.
  out += inside(plate(`M46,${top - 2} L54,${top - 2} L54.5,${bottom - 6} L50,${bottom + 1} L45.5,${bottom - 6} Z`, v.trim))
  const span = bottom - top
  if (v.motif === 'rib') {
    out += inside([0.3, 0.5, 0.7].map((f) => `<path d="M0,${top + span * f} Q50,${top + span * f + 6} 100,${top + span * f}" fill="none" stroke="${tone(v.material, -0.55)}" stroke-width="1.2"/>`).join(''))
  } else if (v.motif === 'vent') {
    out += [-1, 1].map((sd) => [0.35, 0.5, 0.65].map((f) => { const y = top + span * f; const x = 50 + sd * halfAt(y) * 0.55; return seam(`M${(x - 4).toFixed(2)},${y.toFixed(2)} H${(x + 4).toFixed(2)}`) }).join('')).join('')
  } else {
    out += [-1, 1].map((sd) => { const y = top + span * 0.42; const x = 50 + sd * halfAt(y) * 0.5; return seam(`M${(50 + sd * 6).toFixed(2)},${(top + span * 0.2).toFixed(2)} Q${x.toFixed(2)},${y.toFixed(2)} ${(50 + sd * 8).toFixed(2)},${(top + span * 0.75).toFixed(2)}`) }).join('')
  }
  const by = top + span * 0.3
  out += bolts([50 - halfAt(by) * 0.78, 50 + halfAt(by) * 0.78], by)
  // Higher tiers add shoulder guards at the plate's top corners.
  if (n >= 2) {
    out += [-1, 1].map((sd) => {
      const y = top + 4
      const x = 50 + sd * halfAt(y)
      const d = `M${(x - sd * 9).toFixed(2)},${(y - 4).toFixed(2)} Q${(x + sd * 3).toFixed(2)},${(y - 7).toFixed(2)} ${(x + sd * 4).toFixed(2)},${(y + 4).toFixed(2)} L${(x - sd * 2).toFixed(2)},${(y + 13).toFixed(2)} L${(x - sd * 8).toFixed(2)},${(y + 6).toFixed(2)} Z`
      return plate(d, n === 4 ? v.trim : undefined)
    }).join('')
  }
  return `<g data-armor-fit="torso">${out}</g>`
}

/** Collar, bands and a tip ornament fitted along the wearer's own antenna. */
function antennaGear(v: EquipmentVisual, a: { stalk: [Pt, Pt, Pt, Pt]; tip: Pt; scale: number }, plate: PlateFn): string {
  const n = v.construction
  const k = 1 / a.scale // keep fittings a readable size on small crab antennae
  const at = (t: number) => cubicAt(a.stalk[0], a.stalk[1], a.stalk[2], a.stalk[3], t)
  const f = (q: readonly number[]) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`
  const band = (t: number, r: number) => {
    const p = at(t)
    const q = at(Math.min(1, t + 0.04))
    const ang = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI
    return `<g transform="translate(${f(p)}) rotate(${ang.toFixed(1)}) scale(${k.toFixed(2)})"><rect x="-1.6" y="${-r}" width="3.2" height="${2 * r}" rx="1.2" fill="${v.trim}" stroke="${tone(v.material, -0.62)}" stroke-width=".8"/></g>`
  }
  let out = `<g transform="scale(${k.toFixed(2)})"><circle r="3.6" fill="${v.material}" stroke="${v.trim}" stroke-width="1.1"/></g>`
  out += band(0.32, 2.8)
  if (n >= 1) out += band(0.58, 2.4)
  if (n >= 3) out += band(0.8, 2)
  const tip = `translate(${f(a.tip)}) scale(${k.toFixed(2)})`
  if (v.motif === 'crown') {
    out += `<g transform="${tip}">${plate('M-5,2 L-6,-5 L-2.5,-1.5 L0,-7 L2.5,-1.5 L6,-5 L5,2 Z', v.trim)}<circle cy="-1" r="1.3" fill="${v.accent}"/></g>`
  } else {
    // A sensor ring around the tip, with a glowing core that grows with each tier.
    out += `<g transform="${tip}"><circle r="${(3.2 + n * 0.5).toFixed(1)}" fill="none" stroke="${v.trim}" stroke-width="1.4"/><circle r="${(1.4 + n * 0.35).toFixed(1)}" fill="${v.accent}"/></g>`
  }
  if (n >= 2 && v.motif !== 'crown') {
    // A small dish part-way up for the radar tiers.
    const p = at(0.45)
    out += `<g transform="translate(${f(p)}) rotate(-35) scale(${k.toFixed(2)})">${plate('M-1,0 Q3,-7 8,-6 Q6,-1 -1,0 Z', v.material)}</g>`
  }
  return `<g data-antenna-gear="fit">${out}</g>`
}
