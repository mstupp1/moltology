/**
 * Point cloud for the homepage hero shell: an arched, segmented crustacean carapace with a tail
 * fan, walking legs and two long antennae sweeping back over the body. Pure and deterministic,
 * so it can be unit tested and rebuilt at any particle count.
 *
 * Model space: x runs head (left) to tail (right), y points down, z points toward the viewer.
 * The result is centred on the origin and scaled so its longest half-extent is 1.
 */

export interface ShellCloud {
  count: number
  x: Float32Array
  y: Float32Array
  z: Float32Array
  /** 0..1, when each point calcifies: the head plate first, the tail fan last. */
  order: Float32Array
  /** 0..1, how strongly each point is lit: plate rims and edges are brightest. */
  rim: Float32Array
  /** 0..1, position along the body, used for the light that sweeps head to tail. */
  along: Float32Array
  /** Outward surface normal, or zero for the thin parts (antennae, legs, fan) that are lit flat. */
  nx: Float32Array
  ny: Float32Array
  nz: Float32Array
}

/** Small seeded PRNG, so the server, tests and every browser build the same shell. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Plate boundaries along the body: one long carapace plate, then six tapering tail segments. */
export const PLATE_EDGES = [0, 0.34, 0.45, 0.555, 0.655, 0.75, 0.835, 0.91] as const

const ARCH_RADIUS = 1.25
const ARCH_SPAN = 0.85

function plateIndex(u: number): number {
  let i = 0
  while (i < PLATE_EDGES.length - 1 && u >= PLATE_EDGES[i + 1]) i++
  return i
}

/** Each plate swells toward its trailing edge and tucks under the next, like shingles. */
function shingle(u: number): number {
  const i = plateIndex(u)
  const start = PLATE_EDGES[i]
  const end = i + 1 < PLATE_EDGES.length ? PLATE_EDGES[i + 1] : 1
  const f = Math.min(1, Math.max(0, (u - start) / Math.max(1e-6, end - start)))
  return 1 + 0.09 * Math.pow(f, 1.6)
}

function halfWidth(u: number): number {
  const body = Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.55)
  return 0.5 * body * (1.12 - 0.5 * u)
}

type Vec = [number, number, number]

function frame(u: number): { p: Vec; n: Vec; t: Vec } {
  const a = -ARCH_SPAN + 2 * ARCH_SPAN * u
  const p: Vec = [ARCH_RADIUS * Math.sin(a), ARCH_RADIUS * (1 - Math.cos(a)), 0]
  // Outward normal of the arch (up and away from its centre) and the tangent toward the tail.
  const n: Vec = [Math.sin(a), -Math.cos(a), 0]
  const t: Vec = [Math.cos(a), Math.sin(a), 0]
  return { p, n, t }
}

/** A point on the dorsal surface: v = 0 and PI are the two lower edges, PI/2 the ridge. */
function surfaceNormal(u: number, v: number): Vec {
  const { n } = frame(u)
  const s = Math.sin(v)
  const c = Math.cos(v)
  // The dome is flatter than it is wide, so tip the normal toward the ridge a little.
  const len = Math.hypot(s, c * 0.82) || 1
  return [(n[0] * s) / len, (n[1] * s) / len, (c * 0.82) / len]
}

function surface(u: number, v: number, lift = 1): Vec {
  const { p, n } = frame(u)
  const k = shingle(u) * lift
  const w = halfWidth(u) * k
  const h = w * 0.82
  const up = h * Math.sin(v)
  return [p[0] + n[0] * up, p[1] + n[1] * up, w * Math.cos(v)]
}

function bezier(p0: Vec, p1: Vec, p2: Vec, p3: Vec, s: number): Vec {
  const m = 1 - s
  const a = m * m * m
  const b = 3 * m * m * s
  const c = 3 * m * s * s
  const d = s * s * s
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    a * p0[2] + b * p1[2] + c * p2[2] + d * p3[2],
  ]
}

/** Share of the cloud given to each part. Rims carry the silhouette, so they get the most. */
const MIX = { rims: 0.28, lines: 0.12, fill: 0.32, antennae: 0.08, legs: 0.08, fan: 0.12 }

export function buildShell(count: number, seed = 7): ShellCloud {
  const n = Math.max(0, Math.floor(count))
  const rand = mulberry32(seed)
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  const z = new Float32Array(n)
  const order = new Float32Array(n)
  const rim = new Float32Array(n)
  const along = new Float32Array(n)
  const nx = new Float32Array(n)
  const ny = new Float32Array(n)
  const nz = new Float32Array(n)

  const quotas = [
    Math.round(n * MIX.rims),
    Math.round(n * MIX.lines),
    Math.round(n * MIX.fill),
    Math.round(n * MIX.antennae),
    Math.round(n * MIX.legs),
  ]
  const cut: number[] = []
  let acc = 0
  for (const q of quotas) {
    acc += q
    cut.push(Math.min(n, acc))
  }

  const head = surface(0.035, Math.PI / 2)
  const tail = frame(1)

  for (let i = 0; i < n; i++) {
    let pt: Vec
    let u: number
    let lit: number
    let grow: number
    let normal: Vec = [0, 0, 0]
    if (i < cut[0]) {
      // Trailing rim of every plate, plus the front edge of the carapace.
      const e = 1 + Math.floor(rand() * PLATE_EDGES.length)
      u = e < PLATE_EDGES.length ? PLATE_EDGES[e] - 0.004 : 0.995
      const v = rand() * Math.PI
      pt = surface(u, v, 1.01)
      normal = surfaceNormal(u, v)
      lit = 1
      grow = u
    } else if (i < cut[1]) {
      // Dorsal ridge and the two lower edges.
      u = rand()
      const which = rand()
      const v = which < 0.4 ? Math.PI / 2 : which < 0.7 ? 0.02 : Math.PI - 0.02
      pt = surface(u, v + (rand() - 0.5) * 0.04)
      normal = surfaceNormal(u, v)
      lit = which < 0.4 ? 0.75 : 0.85
      grow = u
    } else if (i < cut[2]) {
      u = 0.01 + rand() * 0.98
      const v = rand() * Math.PI
      pt = surface(u, v)
      normal = surfaceNormal(u, v)
      lit = 0.42
      grow = u
    } else if (i < cut[3]) {
      // Antennae: from the head, forward, then in a long sweep back over the body.
      const side = rand() < 0.5 ? -1 : 1
      const s = Math.pow(rand(), 0.8)
      const start: Vec = [head[0] - 0.05, head[1] + 0.05, side * 0.12]
      pt = bezier(
        start,
        [start[0] - 0.75, start[1] - 0.2, side * 0.2],
        [-0.25, -1.05, side * 0.5],
        [1.15, -0.95, side * 0.85],
        s,
      )
      u = 0.02 + s * 0.2
      lit = 0.95 - 0.45 * s
      grow = 0.02 + s * 0.6
    } else if (i < cut[4]) {
      // Short walking legs and swimmerets hanging under each plate.
      u = 0.06 + rand() * 0.8
      const side = rand() < 0.5 ? 0.02 : Math.PI - 0.02
      const base = surface(u, side)
      const { n: nn, t } = frame(u)
      const s = rand()
      const reach = u < PLATE_EDGES[1] ? 0.42 : 0.22
      pt = [
        base[0] - nn[0] * reach * s + t[0] * 0.08 * s * s,
        base[1] - nn[1] * reach * s + t[1] * 0.08 * s * s,
        base[2] * (1 + 0.25 * s),
      ]
      lit = 0.45
      grow = u + 0.05
    } else {
      // Tail fan: five leaves splayed from the last segment.
      const blade = Math.floor(rand() * 5)
      const angle = (blade - 2) * 0.48
      const s = rand()
      const across = (rand() - 0.5) * 2
      const len = blade === 2 ? 0.46 : 0.4
      const width = 0.11 * Math.sin(Math.PI * Math.min(1, s * 1.05)) * across
      const dirX = tail.t[0] * Math.cos(angle)
      const dirY = tail.t[1] * Math.cos(angle)
      const dirZ = Math.sin(angle)
      const sideX = -tail.t[0] * Math.sin(angle)
      const sideY = -tail.t[1] * Math.sin(angle)
      const sideZ = Math.cos(angle)
      const droop = 0.12 * s * s
      pt = [
        tail.p[0] + dirX * len * s + sideX * width - tail.n[0] * droop,
        tail.p[1] + dirY * len * s + sideY * width - tail.n[1] * droop,
        dirZ * len * s + sideZ * width,
      ]
      u = 1
      lit = Math.abs(across) > 0.8 ? 1 : 0.55
      grow = 0.93 + s * 0.07
    }
    x[i] = pt[0]
    y[i] = pt[1]
    z[i] = pt[2]
    rim[i] = lit
    along[i] = u
    nx[i] = normal[0]
    ny[i] = normal[1]
    nz[i] = normal[2]
    order[i] = Math.min(1, Math.max(0, grow + (rand() - 0.5) * 0.06))
  }

  // Centre on the bounding box and normalise the longest half-extent to 1.
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (let i = 0; i < n; i++) {
    minX = Math.min(minX, x[i])
    maxX = Math.max(maxX, x[i])
    minY = Math.min(minY, y[i])
    maxY = Math.max(maxY, y[i])
    minZ = Math.min(minZ, z[i])
    maxZ = Math.max(maxZ, z[i])
  }
  if (n > 0) {
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const cz = (minZ + maxZ) / 2
    const half = Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2 || 1
    for (let i = 0; i < n; i++) {
      x[i] = (x[i] - cx) / half
      y[i] = (y[i] - cy) / half
      z[i] = (z[i] - cz) / half
    }
  }

  return { count: n, x, y, z, order, rim, along, nx, ny, nz }
}
