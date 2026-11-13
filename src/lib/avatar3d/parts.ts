/**
 * Part generators shared by every species: limb segments, claws, feet, tail lobes, spikes,
 * antennae, eyes, lids, brows, mouths and belly plates. Each returns geometry in its own local
 * space; the rig places it on a bone.
 */
import { BufferAttribute, BufferGeometry, Matrix4, Quaternion, SphereGeometry, TorusGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { loft, profile, SHELL_BUMP, spineFrame, type Frame, type Loft, type LoftKey } from './loft'

const Z = new Vector3(0, 0, 1)
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Give a stock three geometry the same attributes as a loft so parts can merge. */
export function withAo(geo: BufferGeometry, ao = 1): BufferGeometry {
  const count = geo.getAttribute('position').count
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) colors.set([ao, 1, SHELL_BUMP], i * 3)
  geo.setAttribute('color', new BufferAttribute(colors, 3))
  if (!geo.getAttribute('uv')) geo.setAttribute('uv', new BufferAttribute(new Float32Array(count * 2), 2))
  return geo
}

/**
 * Say what a part's surface is like: `soft` for the pale membrane at a joint, `bump` for how
 * pebbled the shell is (claws are the roughest).
 */
export function surface(geo: BufferGeometry, o: { soft?: boolean; bump?: number }): BufferGeometry {
  const col = geo.getAttribute('color')
  for (let i = 0; i < col.count; i++) {
    if (o.soft) col.setY(i, 0)
    if (o.bump !== undefined) col.setZ(i, o.bump)
  }
  return geo
}

export function merge(geos: BufferGeometry[]): BufferGeometry {
  if (geos.length === 1) return geos[0]
  const out = mergeGeometries(geos, false)
  if (!out) throw new Error('avatar3d: parts could not be merged')
  return out
}

/** Mirror across the YZ plane, keeping faces pointing outward. */
export function mirrorX(geo: BufferGeometry): BufferGeometry {
  const out = geo.clone()
  for (const name of ['position', 'normal'] as const) {
    const attr = out.getAttribute(name)
    for (let i = 0; i < attr.count; i++) attr.setX(i, -attr.getX(i))
  }
  const index = out.getIndex()
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const b = index.getX(i + 1)
      index.setX(i + 1, index.getX(i + 2))
      index.setX(i + 2, b)
    }
  }
  return out
}

export function placed(geo: BufferGeometry, position: Vector3, quaternion = new Quaternion(), scale = new Vector3(1, 1, 1)): BufferGeometry {
  return geo.applyMatrix4(new Matrix4().compose(position, quaternion, scale))
}

/** Quaternion turning +Y onto `dir`. */
export function alongY(dir: Vector3): Quaternion {
  return new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize())
}

function straightFrame(k: LoftKey, out: Frame): void {
  out.o.set(0, -k.d, 0)
  out.u.set(1, 0, 0)
  out.v.set(0, 0, 1)
}

/** A ball that fills the gap at a joint. */
export function jointBall(radius: number): BufferGeometry {
  return surface(withAo(new SphereGeometry(radius, 20, 14), 0.9), { soft: true, bump: 0 })
}

export interface SegmentOptions {
  /** Raised band near the far end. */
  cuff?: boolean
  /** Ends in a point (walking leg tips). */
  pointed?: boolean
  /** Depth as a fraction of width. */
  flat?: number
}

/**
 * One limb segment hanging from its joint down -Y: a tapered, slightly swollen tube whose ends
 * tuck into the joints, darkened toward both ends so joints read without a shadow pass.
 */
export function limbSegment(length: number, r0: number, r1: number, opts: SegmentOptions = {}): BufferGeometry {
  const flat = opts.flat ?? 1
  const keys: LoftKey[] = opts.pointed
    ? [
        { d: -r0 * 0.7, r: 0 },
        { d: 0, r: r0 * 0.95 },
        { d: length * 0.3, r: r0 },
        { d: length * 0.7, r: r1 },
        { d: length * 0.93, r: r1 * 0.45 },
        { d: length, r: 0 },
      ]
    : [
        { d: -r0 * 0.7, r: 0 },
        { d: 0, r: r0 * 0.9 },
        { d: length * 0.28, r: r0 * 1.04 },
        { d: length * 0.75, r: r1 },
        { d: length, r: r1 * 0.92 },
        { d: length + r1 * 0.7, r: 0 },
      ]
  for (const k of keys) {
    k.front = flat
    k.back = flat
  }
  const body = loft({
    keys,
    frame: straightFrame,
    rows: 18,
    radial: 20,
    ao: (k) => 0.84 + 0.16 * smooth(0, length * 0.1, k.d) * (opts.pointed ? 1 : smooth(length, length * 0.92, k.d)),
  }).geometry
  if (!opts.cuff) return body
  const cuff = new TorusGeometry(r1 * 1.02, r1 * 0.26, 10, 24)
  cuff.rotateX(Math.PI / 2)
  cuff.scale(1, 1, flat)
  cuff.translate(0, -length * 0.9, 0)
  return merge([body, withAo(cuff, 0.9)])
}

export interface ClawStyle {
  /** Palm width multiplier. */
  bulk: number
  /** Finger length multiplier. */
  reach: number
  /** Thickness front to back, as a fraction of width. */
  depth: number
}

export interface ClawGeometry {
  /** Palm and fixed finger, wrist at the origin, hanging down -Y, opening toward +X. */
  palm: BufferGeometry
  /** Moving finger, in the hinge's local space. */
  finger: BufferGeometry
  hinge: Vector3
  /** Where a held item sits, between the fingers. */
  grip: Vector3
}

/** A unit-length pincer (1 from wrist to tip). Scale it to size on the bone. */
export function claw(style: ClawStyle): ClawGeometry {
  const b = style.bulk
  const reach = style.reach
  const palmSpine = spineFrame(
    [
      new Vector3(0, 0.03, 0),
      new Vector3(-0.07 * b, -0.2, 0),
      new Vector3(-0.115 * b, -0.42, 0),
      new Vector3(-0.1 * b, -0.42 - 0.26 * reach, 0),
      new Vector3(-0.03, -0.42 - 0.46 * reach, 0),
      new Vector3(0.07, -0.42 - 0.58 * reach, 0),
    ],
    Z,
  )
  const palmLoft = loft({
    keys: profile(palmSpine.length, [
      [0, 0],
      [0.07, 0.115 * b, { front: style.depth * 1.15, back: style.depth * 1.15 }],
      [0.26, 0.24 * b, { front: style.depth, back: style.depth }],
      [0.44, 0.24 * b, { front: style.depth, back: style.depth }],
      [0.62, 0.15 * b, { front: style.depth * 1.1, back: style.depth * 1.1 }],
      [0.8, 0.085, { front: style.depth * 1.25, back: style.depth * 1.25 }],
      [0.93, 0.045, { front: 0.9, back: 0.9 }],
      [1, 0],
    ]),
    frame: palmSpine.frame,
    rows: 40,
    radial: 32,
    ao: (k) => 0.7 + 0.3 * smooth(0, palmSpine.length * 0.14, k.d),
  })

  const hinge = new Vector3(0.105 * b, -0.36, 0)
  const fingerSpine = spineFrame(
    [
      new Vector3(-0.02, 0.05, 0),
      new Vector3(0.045, -0.14 * reach, 0),
      new Vector3(0.05, -0.36 * reach, 0),
      new Vector3(-0.03, -0.6 * reach, 0),
    ],
    Z,
  )
  const fingerLoft = loft({
    keys: profile(fingerSpine.length, [
      [0, 0],
      [0.1, 0.1, { front: style.depth * 1.1, back: style.depth * 1.1 }],
      [0.4, 0.1, { front: style.depth * 1.15, back: style.depth * 1.15 }],
      [0.75, 0.06, { front: 0.85, back: 0.85 }],
      [0.93, 0.03, { front: 0.9, back: 0.9 }],
      [1, 0],
    ]),
    frame: fingerSpine.frame,
    rows: 26,
    radial: 24,
    ao: (k) => 0.72 + 0.28 * smooth(0, fingerSpine.length * 0.2, k.d),
  })

  // Rounded teeth along the two edges that meet.
  const tooth = (r: number, at: Vector3) => placed(withAo(new SphereGeometry(r, 10, 8), 0.95), at, undefined, new Vector3(1, 1.25, 0.9))
  const palmTeeth = [0.66, 0.75, 0.84].map((s, i) => tooth(0.034 - i * 0.006, palmLoft.point(s, 0.12)))
  const fingerTeeth = [0.52, 0.7].map((s, i) => tooth(0.028 - i * 0.006, fingerLoft.point(s, Math.PI - 0.12)))

  return {
    palm: merge([surface(palmLoft.geometry, { bump: 1 }), ...palmTeeth]),
    finger: merge([surface(fingerLoft.geometry, { bump: 1 }), ...fingerTeeth]),
    hinge,
    grip: new Vector3(0.02, -0.42 - 0.3 * reach, 0),
  }
}

/** A broad three-toed foot. Origin at the ankle, sole on y = -ankleHeight, toes toward +Z. */
export function foot(width: number, length: number, ankleHeight: number): BufferGeometry {
  const toe = (x: number, yaw: number, scale: number) => {
    const g = new SphereGeometry(1, 20, 14)
    g.scale(width * 0.27 * scale, ankleHeight * 0.8 * scale, length * 0.5 * scale)
    g.translate(0, 0, length * 0.3)
    g.rotateY(yaw)
    g.translate(x, -ankleHeight * 0.98, 0)
    return withAo(g, 0.96)
  }
  const heel = new SphereGeometry(1, 20, 14)
  heel.scale(width * 0.42, ankleHeight * 1.0, length * 0.4)
  heel.translate(0, -ankleHeight * 0.85, -length * 0.02)
  const geo = merge([withAo(heel, 0.9), toe(0, 0, 1.08), toe(width * 0.25, 0.3, 0.97), toe(-width * 0.25, -0.3, 0.97)])
  // Flatten the sole so the foot sits on the ground.
  const pos = geo.getAttribute('position')
  const nor = geo.getAttribute('normal')
  const col = geo.getAttribute('color')
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) < -ankleHeight) {
      pos.setY(i, -ankleHeight)
      nor.setXYZ(i, 0, -1, 0)
      col.setXYZ(i, 0.6, 1, 0)
    }
  }
  return geo
}

/** One paddle of a tail fan, pivoting at the origin and reaching down -Y. */
export function tailLobe(length: number, width: number, thickness: number): BufferGeometry {
  return loft({
    keys: [
      { d: -width * 0.2, r: 0 },
      { d: 0, r: width * 0.3, front: 1.1, back: 1.1 },
      { d: length * 0.55, r: width * 0.5, front: thickness, back: thickness },
      { d: length * 0.86, r: width * 0.4, front: thickness, back: thickness },
      { d: length, r: 0, front: thickness, back: thickness },
    ],
    frame: straightFrame,
    rows: 16,
    radial: 20,
    // A soft groove down the middle, like the ribs of a real fan.
    ao: (k, _s, theta) => (0.7 + 0.3 * smooth(0, length * 0.3, k.d)) * (0.7 + 0.3 * Math.pow(Math.abs(Math.sin(theta * 3)), 0.5)),
  }).geometry
}

/** A rounded spike rising +Y from the origin, flared at the base to blend into a shell. */
export function spike(height: number, radius: number): BufferGeometry {
  return loft({
    keys: [
      { d: radius * 0.5, r: radius * 1.5 },
      { d: -height * 0.12, r: radius * 1.02 },
      { d: -height * 0.5, r: radius * 0.6 },
      { d: -height * 0.9, r: radius * 0.2 },
      { d: -height, r: 0 },
    ],
    frame: straightFrame,
    rows: 12,
    radial: 16,
    ao: (k) => 0.82 + 0.18 * smooth(0, height * 0.35, -k.d),
  }).geometry
}

/** A tapering tube along a path: antennae and curled feelers. */
export function taperedTube(points: Vector3[], r0: number, r1: number, rows = 32): BufferGeometry {
  const spine = spineFrame(points)
  return loft({
    keys: profile(spine.length, [
      [0, 0],
      [0.03, r0],
      [0.3, r0 * 0.62 + r1 * 0.38],
      [0.7, r0 * 0.25 + r1 * 0.75],
      [0.97, r1],
      [1, 0],
    ]),
    frame: spine.frame,
    rows,
    radial: 12,
  }).geometry
}

/** Eyeball, facing +Z. The iris is painted by the eye material from the local position. */
export function eyeball(radius: number): BufferGeometry {
  const g = new SphereGeometry(radius, 32, 24)
  g.rotateX(Math.PI / 2)
  return withAo(g)
}

/**
 * Half-shell eyelid around +Y with a thick rim along its edge. Rotating it about X slides the
 * edge over the eye. `lower` flips it for the bottom lid.
 */
export function eyelid(radius: number, lower = false): BufferGeometry {
  const cap = new SphereGeometry(radius * 1.07, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2)
  const rim = new TorusGeometry(radius * 1.07, radius * (lower ? 0.075 : 0.095), 10, 36)
  rim.rotateX(Math.PI / 2)
  // The rim is shaded darker, so the lid edge reads as a line against the eye.
  const geo = merge([withAo(cap), withAo(rim, 0.55)])
  if (lower) geo.rotateX(Math.PI)
  return geo
}

/** A ridge that follows a path over a surface: brows and lips. `out` is the surface normal. */
export function ridge(points: Vector3[], out: Vector3, width: number, height: number, rows = 20): BufferGeometry {
  const spine = spineFrame(points, out.clone().normalize())
  return loft({
    keys: profile(spine.length, [
      [0, 0],
      [0.1, width * 0.55, { front: height / width, back: height / width }],
      [0.45, width, { front: height / width, back: height / width }],
      [0.85, width * 0.6, { front: height / width, back: height / width }],
      [1, 0],
    ]),
    frame: spine.frame,
    rows,
    radial: 12,
  }).geometry
}

export interface BellyOptions {
  /** Height range on the host loft (its `d`), top first. */
  top: number
  bottom: number
  plates: number
  /** Half width in radians around the front, at the top and bottom. */
  spreadTop: number
  spreadBottom: number
  lift: number
}

/**
 * Segmented belly plates laid over the front of a body loft. Each plate bulges and the seams
 * between them sink and darken, so the panel reads as stacked armour without any texture.
 */
export function bellyPlates(host: Loft, o: BellyOptions): BufferGeometry {
  const s0 = host.sAt(o.top)
  const s1 = host.sAt(o.bottom)
  const perPlate = 9
  const rows = o.plates * perPlate + 1
  const cols = 28
  const positions = new Float32Array(rows * (cols + 1) * 3)
  const colors = new Float32Array(rows * (cols + 1) * 3)
  const uvs = new Float32Array(rows * (cols + 1) * 2)
  const p = new Vector3()
  const n = new Vector3()
  let vi = 0
  for (let i = 0; i < rows; i++) {
    const t = i / (rows - 1)
    const s = s0 + (s1 - s0) * t
    // The panel closes to a rounded point at both ends.
    const close = Math.pow(Math.sin(Math.PI * Math.min(t * 3.2, 0.5)), 0.6) * Math.pow(Math.sin(Math.PI * Math.min((1 - t) * 2.2, 0.5)), 0.7)
    const spread = (o.spreadTop + (o.spreadBottom - o.spreadTop) * t) * close
    const f = (t * o.plates) % 1
    const plate = i === rows - 1 ? 0 : Math.pow(Math.sin(Math.PI * Math.min(Math.max(f, 0.001), 0.999)), 0.45)
    for (let j = 0; j <= cols; j++) {
      const a = (j / cols) * 2 - 1
      const theta = Math.PI / 2 - a * spread
      host.point(s, theta, p)
      host.normal(s, theta, n)
      const edge = Math.pow(Math.max(1 - a * a, 0), 0.35)
      const h = o.lift * (edge * (0.35 + 0.65 * plate) * (0.4 + 0.6 * close) - 0.3)
      p.addScaledVector(n, h)
      positions.set([p.x, p.y, p.z], vi * 3)
      const ao = 0.5 + 0.5 * Math.min(1, plate * 1.2) * (0.55 + 0.45 * edge)
      colors.set([ao, ao, ao], vi * 3)
      uvs.set([j / cols, t], vi * 2)
      vi++
    }
  }
  const index: number[] = []
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j
      const b = a + cols + 1
      index.push(a, a + 1, b, a + 1, b + 1, b)
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  geo.setAttribute('uv', new BufferAttribute(uvs, 2))
  geo.setAttribute('color', new BufferAttribute(colors, 3))
  geo.setIndex(index)
  geo.computeVertexNormals()
  // Face the panel outward whichever way the host's angles run.
  const nor = geo.getAttribute('normal')
  const mid = Math.floor(rows / 2) * (cols + 1) + Math.floor(cols / 2)
  host.normal((s0 + s1) / 2, Math.PI / 2, n)
  if (new Vector3().fromBufferAttribute(nor, mid).dot(n) < 0) {
    for (let i = 0; i < index.length; i += 3) {
      const t = index[i + 1]
      index[i + 1] = index[i + 2]
      index[i + 2] = t
    }
    geo.setIndex(index)
    geo.computeVertexNormals()
  }
  return geo
}

/**
 * A thin patch defined by a function over the unit square, with rounded-off corners left to the
 * caller's curves. Used for anything painted onto a shell that needs its own colour.
 */
export function surfacePatch(at: (u: number, t: number) => Vector3, facing: Vector3, cols = 24, rows = 8): BufferGeometry {
  const positions = new Float32Array((rows + 1) * (cols + 1) * 3)
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cols; j++) {
      const p = at(j / cols, i / rows)
      positions.set([p.x, p.y, p.z], (i * (cols + 1) + j) * 3)
    }
  }
  const index: number[] = []
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j
      const b = a + cols + 1
      index.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  geo.setIndex(index)
  geo.computeVertexNormals()
  const mid = Math.floor(rows / 2) * (cols + 1) + Math.floor(cols / 2)
  if (new Vector3().fromBufferAttribute(geo.getAttribute('normal'), mid).dot(facing) < 0) {
    for (let i = 0; i < index.length; i += 3) {
      const t = index[i + 1]
      index[i + 1] = index[i + 2]
      index[i + 2] = t
    }
    geo.setIndex(index)
    geo.computeVertexNormals()
  }
  return withAo(geo)
}
