/**
 * Lofted surfaces: the one primitive every body part is made from.
 *
 * A loft is a stack of rings along a spine. Each ring is a superellipse whose size comes from a
 * handful of keys, so a whole shell is a few numbers and stays editable by traits (head shape,
 * build, claw style). The surface is analytic, which lets other parts sit exactly on it: eyes,
 * spikes, belly plates and gear all ask the loft where its skin is.
 */
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Vector3 } from 'three'

/** `d` is distance along the spine, `r` the ring's half width. Extra fields shape the ring. */
export type LoftKey = { d: number; r: number } & Record<string, number>

export interface Frame {
  /** Ring centre. */
  o: Vector3
  /** Width axis. */
  u: Vector3
  /** Depth axis. */
  v: Vector3
}

export interface LoftOptions {
  keys: LoftKey[]
  frame: (k: LoftKey, out: Frame) => void
  /** Ring offsets along the width and depth axes. Defaults to a superellipse. */
  shape?: (k: LoftKey, theta: number) => [number, number]
  rows?: number
  radial?: number
  /** Baked occlusion, 0 (dark) to 1, stored as vertex colour. */
  ao?: (k: LoftKey, s: number, theta: number) => number
}

export interface Loft {
  geometry: BufferGeometry
  /** Surface point at s (0 to 1 along the keys) and angle theta (0 = +u, PI/2 = +v). */
  point: (s: number, theta: number, out?: Vector3) => Vector3
  normal: (s: number, theta: number, out?: Vector3) => Vector3
  /** The s where the spine distance equals d. Needs keys with a monotonic d. */
  sAt: (d: number) => number
  key: (s: number) => LoftKey
}

const DEFAULTS: Record<string, number> = { front: 1, back: 1, n: 2, x: 0, z: 0 }

/** Cubic Hermite on a unit interval. */
function hermite(p1: number, m1: number, p2: number, m2: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return (2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * m2
}

/** Tangent at b that never overshoots its neighbours, so unevenly spaced keys cannot fold the surface. */
function tangent(a: number, b: number, c: number): number {
  const d0 = b - a
  const d1 = c - b
  if (d0 * d1 <= 0) return 0
  const m = (c - a) / 2
  const limit = 3 * Math.min(Math.abs(d0), Math.abs(d1))
  return Math.sign(m) * Math.min(Math.abs(m), limit)
}

/** Smooth key sampler. Closed ends (r = 0) mirror their neighbour so caps come out round. */
export function keySampler(keys: LoftKey[]): (s: number) => LoftKey {
  const fields = new Set<string>(['d', 'r'])
  for (const k of keys) for (const f of Object.keys(k)) fields.add(f)
  const filled = keys.map((k) => {
    const out: Record<string, number> = {}
    for (const f of fields) out[f] = k[f] ?? DEFAULTS[f] ?? 0
    return out as LoftKey
  })
  const last = filled.length - 1
  const ghost = (edge: LoftKey, inner: LoftKey): LoftKey => {
    const g: Record<string, number> = {}
    for (const f of fields) g[f] = edge.r === 0 ? inner[f] : 2 * edge[f] - inner[f]
    if (edge.r === 0) g.r = -inner.r
    return g as LoftKey
  }
  const before = ghost(filled[0], filled[1])
  const after = ghost(filled[last], filled[last - 1])
  const at = (i: number) => (i < 0 ? before : i > last ? after : filled[i])
  return (s: number) => {
    const f = Math.min(Math.max(s, 0), 1) * last
    const i = Math.min(Math.floor(f), last - 1)
    const t = f - i
    const out: Record<string, number> = {}
    for (const field of fields) {
      const p0 = at(i - 1)[field]
      const p1 = at(i)[field]
      const p2 = at(i + 1)[field]
      const p3 = at(i + 2)[field]
      out[field] = hermite(p1, tangent(p0, p1, p2), p2, tangent(p1, p2, p3), t)
    }
    if (out.r < 0) out.r = 0
    return out as LoftKey
  }
}

const spow = (c: number, e: number) => Math.sign(c) * Math.pow(Math.abs(c), e)

export function superellipse(k: LoftKey, theta: number): [number, number] {
  const e = 2 / (k.n || 2)
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  return [k.r * spow(c, e), k.r * (s >= 0 ? (k.front ?? 1) : (k.back ?? 1)) * spow(s, e)]
}

/** Mesh density for everything lofted from here on; small stills need far fewer rings. */
let detail = 1

/** Build with coarser (or finer) meshes inside `fn`: 0.5 halves rows and ring points. */
export function withLoftDetail<T>(scale: number, fn: () => T): T {
  const before = detail
  detail = scale
  try {
    return fn()
  } finally {
    detail = before
  }
}

export function loft(opts: LoftOptions): Loft {
  const rows = Math.max(6, Math.round((opts.rows ?? 40) * detail))
  const radial = Math.max(8, Math.round(((opts.radial ?? 40) * detail) / 2) * 2)
  const sample = keySampler(opts.keys)
  const shape = opts.shape ?? superellipse
  const frame: Frame = { o: new Vector3(), u: new Vector3(), v: new Vector3() }

  const point = (s: number, theta: number, out = new Vector3()) => {
    const k = sample(s)
    opts.frame(k, frame)
    const [a, b] = shape(k, theta)
    return out.copy(frame.o).addScaledVector(frame.u, a).addScaledVector(frame.v, b)
  }

  const pa = new Vector3()
  const pb = new Vector3()
  const pc = new Vector3()
  const pd = new Vector3()
  const centre = new Vector3()
  const normal = (s: number, theta: number, out = new Vector3()) => {
    const es = 1e-3
    const et = 1e-3
    point(Math.min(s + es, 1), theta, pa)
    point(Math.max(s - es, 0), theta, pb)
    point(s, theta + et, pc)
    point(s, theta - et, pd)
    out.copy(pc.sub(pd)).cross(pa.sub(pb))
    const p = point(s, theta, pa)
    opts.frame(sample(s), frame)
    centre.copy(frame.o)
    if (sample(s).r < 1e-7 || out.lengthSq() < 1e-30) {
      // Pole: every ring point coincides, so push straight along the spine.
      point(s < 0.5 ? 0.02 : 0.98, theta, pb)
      opts.frame(sample(s < 0.5 ? 0.02 : 0.98), frame)
      out.copy(p).sub(frame.o)
      if (out.lengthSq() < 1e-14) out.set(0, 1, 0)
      return out.normalize()
    }
    out.normalize()
    if (out.dot(p.sub(centre)) < 0) out.negate()
    return out
  }

  const positions = new Float32Array(rows * (radial + 1) * 3)
  const normals = new Float32Array(rows * (radial + 1) * 3)
  const uvs = new Float32Array(rows * (radial + 1) * 2)
  const colors = new Float32Array(rows * (radial + 1) * 3)
  const p = new Vector3()
  const n = new Vector3()
  const origins: Vector3[] = []
  let vi = 0
  for (let i = 0; i < rows; i++) {
    const s = i / (rows - 1)
    const k = sample(s)
    opts.frame(k, frame)
    origins.push(frame.o.clone())
    // The ring's key and frame are the same all the way round, so work them out once per row.
    for (let j = 0; j <= radial; j++) {
      const theta = (j / radial) * Math.PI * 2
      const [a, b] = shape(k, theta)
      p.copy(frame.o).addScaledVector(frame.u, a).addScaledVector(frame.v, b)
      positions[vi * 3] = p.x
      positions[vi * 3 + 1] = p.y
      positions[vi * 3 + 2] = p.z
      uvs[vi * 2] = j / radial
      uvs[vi * 2 + 1] = s
      const ao = opts.ao ? opts.ao(k, s, theta) : 1
      colors[vi * 3] = colors[vi * 3 + 1] = colors[vi * 3 + 2] = ao
      vi++
    }
  }
  // Normals from neighbouring vertices (cheap); only poles fall back to the analytic normal.
  const at = (i: number, j: number, out: Vector3) => out.fromArray(positions, (i * (radial + 1) + j) * 3)
  const ds = new Vector3()
  const dt = new Vector3()
  const q = new Vector3()
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j <= radial; j++) {
      const jw = j % radial
      at(Math.min(i + 1, rows - 1), j, ds).sub(at(Math.max(i - 1, 0), j, q))
      at(i, (jw + 1) % radial, dt).sub(at(i, (jw - 1 + radial) % radial, q))
      n.copy(dt).cross(ds)
      if (n.lengthSq() < 1e-22) {
        normal(i / (rows - 1), (j / radial) * Math.PI * 2, n)
      } else {
        n.normalize()
        if (n.dot(at(i, j, q).sub(origins[i])) < 0) n.negate()
      }
      const o = (i * (radial + 1) + j) * 3
      normals[o] = n.x
      normals[o + 1] = n.y
      normals[o + 2] = n.z
    }
  }

  const index = rows * (radial + 1) > 65535 ? new Uint32Array((rows - 1) * radial * 6) : new Uint16Array((rows - 1) * radial * 6)
  let ii = 0
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j
      const b = a + radial + 1
      index[ii++] = a
      index[ii++] = b
      index[ii++] = a + 1
      index[ii++] = a + 1
      index[ii++] = b
      index[ii++] = b + 1
    }
  }
  // Make the winding agree with the outward normals, whatever way the spine runs.
  const mid = Math.floor(rows / 2) * (radial + 1)
  const v0 = new Vector3().fromArray(positions, mid * 3)
  const v1 = new Vector3().fromArray(positions, (mid + radial + 1) * 3)
  const v2 = new Vector3().fromArray(positions, (mid + 1) * 3)
  const face = v1.sub(v0).cross(v2.sub(v0))
  if (face.dot(new Vector3().fromArray(normals, mid * 3)) < 0) {
    for (let i = 0; i < index.length; i += 3) {
      const t = index[i + 1]
      index[i + 1] = index[i + 2]
      index[i + 2] = t
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  geometry.setIndex(new BufferAttribute(index, 1))

  const d0 = opts.keys[0].d
  const d1 = opts.keys[opts.keys.length - 1].d
  const sAt = (d: number) => {
    let lo = 0
    let hi = 1
    for (let i = 0; i < 28; i++) {
      const m = (lo + hi) / 2
      const dm = sample(m).d
      if (d1 > d0 ? dm < d : dm > d) lo = m
      else hi = m
    }
    return (lo + hi) / 2
  }

  return { geometry, point, normal, sAt, key: sample }
}

/** Frame for an upright body: rings stay level, keys carry height (`d`) and a z lean. */
export function uprightFrame(k: LoftKey, out: Frame): void {
  out.o.set(k.x ?? 0, k.d, k.z ?? 0)
  out.u.set(1, 0, 0)
  out.v.set(0, 0, 1)
}

/** Frame that follows a curve. With `planeNormal` the depth axis stays fixed (flat parts such as claws). */
export function spineFrame(points: Vector3[], planeNormal?: Vector3) {
  const curve = new CatmullRomCurve3(points, false, 'centripetal')
  const length = curve.getLength()
  const tan = new Vector3()
  const ref = new Vector3()
  const frame = (k: LoftKey, out: Frame) => {
    const t = k.d / length
    const tc = Math.min(Math.max(t, 0), 1)
    curve.getPointAt(tc, out.o)
    curve.getTangentAt(tc, tan)
    if (t !== tc) out.o.addScaledVector(tan, (t - tc) * length)
    if (planeNormal) {
      out.v.copy(planeNormal)
    } else {
      ref.set(0, 0, 1)
      if (Math.abs(tan.z) > 0.9) ref.set(1, 0, 0)
      out.v.copy(ref).addScaledVector(tan, -ref.dot(tan)).normalize()
    }
    out.u.copy(out.v).cross(tan).normalize()
  }
  return { length, frame, curve }
}

/** Keys from `[t, r, extra?]` rows, with t from 0 to 1 along a spine of the given length. */
export function profile(length: number, rows: readonly (readonly [number, number, Record<string, number>?])[]): LoftKey[] {
  return rows.map(([t, r, extra]) => ({ d: t * length, r, ...extra }))
}
