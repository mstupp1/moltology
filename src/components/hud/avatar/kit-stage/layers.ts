/**
 * Splits a painted-kit SVG (from `buildAvatarSvg` with `kit`) into the pieces the WebGL stage
 * draws: one node per idle group the CSS already animates, and one run per stretch of images
 * between those groups, in paint order. Reading the composed SVG, rather than the manifest,
 * keeps the stage in step with everything compose.ts decides (variants, gear, looks, tints,
 * mirroring) without a second copy of those rules.
 */

/** Idle groups compose.ts emits (`lobster-idle-<name>`), plus the stage's own iris node. */
export type KitStageAnim =
  | 'root'
  | 'carapace'
  | 'abdomen'
  | 'antenna-left'
  | 'antenna-right'
  | 'claw-left'
  | 'claw-right'
  | 'tail'
  | 'flank-limbs'
  | 'eyes'
  | 'iris'
  | 'blink'
  | 'other'

export interface KitStageNode {
  anim: KitStageAnim
  /** Index of the parent node; -1 for the root. */
  parent: number
  /** Pivot in viewBox units, from the group's inline `transform-origin`, when compose set one. */
  pivot: [number, number] | null
  /** Fallback pivot as a fraction of the node's painted bounds (the CSS `fill-box` origin). */
  origin: [number, number]
  /** Parallax depth: negative sits behind the body, positive in front. */
  depth: number
}

export interface KitStageRun {
  node: number
  /** Serialized elements, drawn together into one texture. */
  markup: string
  /** Image hrefs the markup references, to inline before rasterizing. */
  hrefs: string[]
  /** Holds gear or a look (worn items), for the equip burst. */
  worn: boolean
}

export interface KitStageScene {
  /** Character frame in viewBox units: x, y, width, height. */
  viewBox: [number, number, number, number]
  defs: string
  /** The member's backdrop group, or null for a transparent avatar. */
  backdrop: string | null
  /** Filter on the whole character (the glow finish), applied to every run. */
  rootFilter: string | null
  finish: string
  nodes: KitStageNode[]
  runs: KitStageRun[]
}

/** Same origins as avatar-animations.css, for groups without an inline pivot. */
const FILL_BOX_ORIGIN: Record<KitStageAnim, [number, number]> = {
  root: [0.5, 1],
  carapace: [0.5, 1],
  abdomen: [0.5, 1],
  'antenna-left': [1, 1],
  'antenna-right': [0, 1],
  'claw-left': [0.5, 0.5],
  'claw-right': [0.5, 0.5],
  tail: [0.5, 0],
  'flank-limbs': [0.5, 0],
  eyes: [0.5, 0.5],
  iris: [0.5, 0.5],
  blink: [0.5, 0.5],
  other: [0.5, 0.5],
}

const DEPTH: Record<KitStageAnim, number> = {
  root: 0,
  carapace: 0,
  abdomen: 0.1,
  'antenna-left': -0.7,
  'antenna-right': -0.7,
  'claw-left': 0.9,
  'claw-right': 0.9,
  tail: -0.8,
  'flank-limbs': -0.3,
  eyes: 0.45,
  iris: 0.15,
  blink: 0.05,
  other: 0,
}

const IDLE_PREFIX = 'lobster-idle-'
const KNOWN_ANIMS = new Set<string>(Object.keys(FILL_BOX_ORIGIN))

function animOf(el: Element): KitStageAnim | null {
  const classes = (el.getAttribute('class') ?? '').split(/\s+/)
  if (!classes.includes('lobster-idle-layer')) return null
  const named = classes.find((c) => c.startsWith(IDLE_PREFIX) && c !== 'lobster-idle-layer')
  const name = named?.slice(IDLE_PREFIX.length) ?? 'other'
  return (KNOWN_ANIMS.has(name) ? name : 'other') as KitStageAnim
}

function parsePivot(el: Element): [number, number] | null {
  const m = (el.getAttribute('style') ?? '').match(/transform-origin:\s*(-?[\d.]+)px\s+(-?[\d.]+)px/)
  return m ? [Number(m[1]), Number(m[2])] : null
}

function hrefOf(el: Element): string | null {
  return el.getAttribute('href') ?? el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
}

/** Kit art keys put worn items under `/gear/` and `/look/`. */
export function isWornHref(href: string): boolean {
  return /\/(gear|look)\//.test(href)
}

const isIris = (el: Element) => el.tagName.toLowerCase() === 'image' && /\/iris\//.test(hrefOf(el) ?? '')

export function parseKitStageScene(svg: string): KitStageScene | null {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  if (!root || root.getAttribute('data-kit') !== '1') return null
  const character = root.querySelector('g.avatar-character')
  if (!character) return null

  const vb = (root.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number)
  if (vb.length !== 4 || vb.some((n) => !Number.isFinite(n))) return null

  const serializer = new XMLSerializer()
  const nodes: KitStageNode[] = []
  const runs: KitStageRun[] = []

  const addNode = (anim: KitStageAnim, parent: number, pivot: [number, number] | null): number => {
    nodes.push({ anim, parent, pivot, origin: FILL_BOX_ORIGIN[anim], depth: DEPTH[anim] })
    return nodes.length - 1
  }

  const flush = (node: number, pending: Element[]) => {
    if (!pending.length) return
    const hrefs: string[] = []
    for (const el of pending) {
      const images = el.tagName.toLowerCase() === 'image' ? [el] : Array.from(el.querySelectorAll('image'))
      for (const img of images) {
        const h = hrefOf(img)
        if (h && !hrefs.includes(h)) hrefs.push(h)
      }
    }
    runs.push({
      node,
      markup: pending.map((el) => serializer.serializeToString(el)).join(''),
      hrefs,
      worn: hrefs.some(isWornHref),
    })
    pending.length = 0
  }

  const walk = (el: Element, node: number) => {
    const pending: Element[] = []
    for (const child of Array.from(el.children)) {
      const anim = animOf(child)
      if (anim) {
        flush(node, pending)
        // Blink lids start hidden for the CSS; the stage sets their alpha itself.
        if (anim === 'blink') child.removeAttribute('opacity')
        walk(child, addNode(anim, node, parsePivot(child)))
      } else if (isIris(child)) {
        // Irises get their own node so the eyes can follow the pointer.
        flush(node, pending)
        const iris = addNode('iris', node, null)
        runs.push({ node: iris, markup: serializer.serializeToString(child), hrefs: [hrefOf(child)!], worn: false })
      } else {
        pending.push(child)
      }
    }
    flush(node, pending)
  }

  walk(character, addNode('root', -1, null))
  if (!runs.length) return null

  const defs = root.querySelector('defs')
  const backdrop = root.querySelector('#lobster-background-layer')
  const filter = character.getAttribute('filter')

  return {
    viewBox: vb as [number, number, number, number],
    defs: defs ? Array.from(defs.childNodes).map((n) => serializer.serializeToString(n)).join('') : '',
    backdrop: backdrop ? serializer.serializeToString(backdrop) : null,
    rootFilter: filter,
    finish: root.getAttribute('data-finish') ?? 'gloss',
    nodes,
    runs,
  }
}

/** Worn-item hrefs in a scene, to spot what was just equipped. */
export function wornHrefs(scene: KitStageScene): Set<string> {
  const out = new Set<string>()
  for (const run of scene.runs) for (const h of run.hrefs) if (isWornHref(h)) out.add(h)
  return out
}
