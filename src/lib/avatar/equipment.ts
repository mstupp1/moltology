/** Worn geometry and inventory art share this registry. Never use inventory photographs as overlays. */
import type { EquipmentCategory } from '../../db/schema'
import { renderAccessory } from './parts'
import { paintDefs, type PaintContext } from './paint'
import { SHELL_PALETTES, type AvatarAccessory } from './traits'

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
  ['larval-plate-vest', 'carapace', '#54706a', '#a9bbb0', '#c5d3ba', 0, 'plate'],
  ['tide-braced-carapace', 'carapace', '#345765', '#93b5b8', '#8bd7d2', 1, 'rib'],
  ['abyssal-ward-shell', 'carapace', '#34394f', '#a99bc9', '#c7a4ff', 3, 'plate'],
  ['hydrostatic-seal-plate', 'carapace', '#162c38', '#c99f54', '#85f0e0', 4, 'vent'],
  ['training-pincers', 'claws', '#62726a', '#bdc9b0', '#dae6ca', 0, 'plate'],
  ['hydraulic-crush-claws', 'claws', '#3d5961', '#a9bfc5', '#61dddf', 2, 'crusher'],
  ['synapse-shear-claws', 'claws', '#25354a', '#e3b765', '#87f5f3', 4, 'slim'],
  ['silt-maul', 'claws', '#66594d', '#b3a68a', '#dfc998', 1, 'hammer'],
  ['tideforge-hammer', 'claws', '#314958', '#a2c2c7', '#86e2ed', 2, 'hammer'],
  ['soft-shell-visor', 'head', '#547e86', '#b4d4c8', '#91edf2', 0, 'plate', 'visor'],
  ['architect-crown-plate', 'head', '#3f5e68', '#c1b08b', '#9ce1e5', 2, 'crown'],
  ['oracle-dome-lattice', 'head', '#243448', '#d3b46b', '#b8a9ff', 4, 'crown'],
  ['silt-walker-greaves', 'legs', '#5d716b', '#b4c4ae', '#d6dfc1', 0, 'plate'],
  ['current-cutter-legs', 'legs', '#355b64', '#9fc5bf', '#8ce0d4', 1, 'vent'],
  ['void-stride-articulation', 'legs', '#302d48', '#a8a1cd', '#c5aeff', 3, 'rib'],
  ['larval-feelers', 'antennae', '#6b7b6c', '#bdc7ab', '#d4e4c0', 0, 'sensor'],
  ['depth-sense-antennae', 'antennae', '#3e625f', '#a2bda3', '#a1e8d7', 1, 'sensor'],
  ['benthic-radar-array', 'antennae', '#344f62', '#9db9ce', '#85d9ff', 2, 'sensor'],
  ['ascendant-signal-crown', 'antennae', '#433b4f', '#c2a9cf', '#edb7ff', 3, 'crown'],
  ['larval-chitin-cincture', 'belt', '#6c6253', '#bcba93', '#dfd7b1', 0, 'plate'],
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
export const getEquipmentVisual = (key: string) => EQUIPMENT_VISUALS[key]

/** Local coordinates: torso 0..60, head centred at y=0, weapon cuff at y=0. */
export function renderEquipment(key: string, ctx: PaintContext): string {
  const v = getEquipmentVisual(key)
  if (!v) return ''
  const uid = `${ctx.uid}-eq-${v.key}`,
    n = v.construction
  const plate = (d: string, fill = `url(#${uid})`) =>
    `<path d="${d}" fill="${fill}" stroke="#14252b" stroke-width="1.1" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${v.trim}" stroke-width="0.55" opacity=".65" transform="translate(0 -.5)"/>`
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
      { x: 0, top: 0, eyeY: 26, mouth: [0, 40] },
    )
  } else if (v.category === 'carapace') {
    body =
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
    body =
      plate('M-27,-5 Q0,1 27,-5 L26,7 Q0,14 -26,7 Z') +
      plate(`M-${6 + n},-4 L${6 + n},-4 L${8 + n},8 L0,${13 + n} L-${8 + n},8 Z`, v.trim) +
      bolts([-21, 21], 2)
    if (v.motif === 'vent') body += [-17, -12, 12, 17].map((x) => seam(`M${x},0 v5`)).join('')
  } else if (v.category === 'legs') {
    body =
      plate(`M-8,-2 L8,-2 L${10 + n},17 L6,29 L-6,29 L-${10 + n},17 Z`) +
      plate('M-6,27 L6,27 L9,45 L-9,45 Z') +
      plate('M-9,41 L8,41 L14,48 L-13,48 L-14,46 Z', v.material) +
      seam('M-5,8 L0,13 L5,8 M-4,32 H4')
  } else if (v.category === 'antennae') {
    body = plate('M-18,0 Q0,-6 18,0 L15,7 Q0,3 -15,7 Z')
    for (const side of [-1, 1]) {
      body += `<g transform="scale(${side} 1)"><path d="M12,2 Q${18 + n * 3},${-22 - n * 4} ${30 + n * 3},${-25 - n * 5}" fill="none" stroke="#152930" stroke-width="5"/><path d="M12,2 Q${18 + n * 3},${-22 - n * 4} ${30 + n * 3},${-25 - n * 5}" fill="none" stroke="${v.trim}" stroke-width="2.6"/><circle cx="${30 + n * 3}" cy="${-25 - n * 5}" r="${2 + n}" fill="${v.accent}"/>${n > 1 ? seam('M20,-9 l9,-4 m-5,-2 l9,-4') : ''}</g>`
    }
  } else if (v.category === 'head') {
    body =
      plate(
        `M-30,7 L-24,-9 L-12,-${15 + n * 2} L0,-${9 + n * 4} L12,-${15 + n * 2} L24,-9 L30,7 L21,13 L18,3 L-18,3 L-21,13 Z`,
      ) +
      plate('M-18,3 L-14,-6 L0,-1 L14,-6 L18,3 Z', v.trim) +
      seam('M-12,-5 L0,-9 L12,-5') +
      bolts([-25, 25], 4)
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
  if (!v.accessory && v.category === 'carapace' && n >= 2) {
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
  if (v.category === 'legs' && n > 0) {
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
          `<g transform="scale(${side} 1)">${plate(n === 4 ? 'M12,-4 L23,-10 L28,-3 L25,14 L16,18 L15,7 Z' : 'M15,-3 L25,-1 L24,12 L16,15 Z')}${seam(n === 4 ? 'M19,-2 V10 M23,-2 V8' : 'M19,1 V8')}</g>`,
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
  if (n > 1)
    body += `<g fill="${v.accent}">${[0, 1, 2].map((i) => `<circle cx="${(i - 1) * 4}" cy="${v.category === 'claws' ? -8 : 3}" r=".8"/>`).join('')}</g>`
  if (n === 4)
    body += `<g class="equipment-signature" fill="none" stroke="${v.accent}" stroke-width=".65" opacity=".7">${v.category === 'claws' ? '<path d="M-14,-20 l3,-8 M10,-25 l3,-8"/>' : '<path d="M-12,10 L0,16 L12,10 M-9,14 L0,20 L9,14"/>'}</g>`
  return `<g data-equipment="${v.key}" data-construction="${n}"><defs><linearGradient id="${uid}" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="${v.trim}"/><stop offset=".2" stop-color="${v.material}"/><stop offset=".32" stop-color="${v.trim}" stop-opacity=".65"/><stop offset=".65" stop-color="${v.material}"/><stop offset="1" stop-color="#101f29"/></linearGradient></defs>${body}</g>`
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
