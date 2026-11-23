/**
 * Cloth gear: garments over the torso and arms, and shoes. Like armour, every panel is the body's
 * own surface pushed out a little (Kit.puff), so it fits every species and build; a coat adds a
 * skirt that hangs below the torso. Fittings (lapels, buttons, cuffs, belts, laces) sit on that
 * surface in the trim colour, and never glow.
 */
import { BufferAttribute, BufferGeometry, TorusGeometry, Vector3 } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Kit, SIDES, above, below, fromFront, onBody, seam, smooth, stud, tube, v, within } from './gear-kit'
import type { Wearable } from './rig'
import { SWIMMERETS } from './species'

const LIFT = 0.03

/**
 * A garment's cut comes from its motif: `tank` (no sleeves), `jacket` (sleeves, to the hip) or
 * `coat` (sleeves and a skirt). Construction adds detail: 1 trim stripes, 2 lapels and buttons,
 * 3 a turtleneck collar under the lapels, 4 a belt and double row of buttons (trench).
 */
export function garment(kit: Kit, wear: Wearable): void {
  const { loft: host, bone, top, bottom, belt } = wear.torso
  const { motif, construction: n } = kit.visual
  const sleeves = motif !== 'tank'

  // A lobster's swimmerets and both species' short walking legs would poke through the cloth.
  for (const { tag } of SIDES) {
    for (let i = 0; i < SWIMMERETS.length; i++) kit.tuck(`swimmeret${i}${tag}`)
    for (const leg of [1, 2]) kit.tuck(`sideLeg${leg}a${tag}`)
  }

  // The body, all the way round, from just under the belt line up to the neck. The belly
  // plates are a separate layer, so they are covered too.
  const hem = Math.min(bottom, belt) - 0.04
  kit.puff(bone, 'fabric', (_p, w) => LIFT * above(w.y, hem, 0.025))
  kit.puff(bone, 'fabric', (_p, w) => (LIFT - 0.002) * above(w.y, hem, 0.025), 'belly')
  if (wear.race === 'crab') {
    // A crab's shell is its body too: the cloth comes up round the lower shell to a collar under
    // the face, higher at the sides and back, so the shell sits in the garment like a head.
    const { loft: shell, bone: shellBone, eyeY, eyeRadius } = wear.head
    const front = eyeY - eyeRadius * (motif === 'tank' ? 2.6 : 2.25)
    const back = front + (motif === 'tank' ? 0.1 : 0.2)
    const collar = (phi: number) => front + (back - front) * smooth(0.5, 2.3, phi)
    kit.puff(shellBone, 'fabric', (_p, w) => LIFT * below(w.y, collar(fromFront(shell, w)), 0.03))
    const ring: Vector3[] = []
    for (let i = 0; i <= 64; i++) {
      const phi = -Math.PI + (i / 64) * Math.PI * 2
      ring.push(onBody(shell, collar(Math.abs(phi)), phi, LIFT + 0.002).at)
    }
    kit.addWorld(shellBone, n >= 2 ? 'trim' : 'fabric', tube(ring, 0.016, 160))
  }
  if (sleeves) {
    const { fore } = wear.arm
    for (const { tag } of SIDES) {
      kit.puff(`arm${tag}`, 'fabric', () => LIFT * 0.8)
      kit.puff(`forearm${tag}`, 'fabric', (p) => LIFT * 0.8 * above(p.y, -fore * 0.86, 0.02))
      const cuff = new TorusGeometry(wear.arm.radius * 1.05 + LIFT, 0.014, 8, 28)
      cuff.rotateX(Math.PI / 2)
      cuff.translate(0, -fore * 0.82, 0)
      kit.add(`forearm${tag}`, n >= 2 ? 'trim' : 'fabric', cuff)
    }
  }

  const height = top - hem
  if (motif === 'tank') {
    // Two bold stripes round the chest.
    for (const t of [0.62, 0.74]) {
      const y = hem + height * t
      const ring: Vector3[] = []
      for (let i = 0; i <= 40; i++) ring.push(onBody(host, y, -Math.PI + (i / 40) * Math.PI * 2, LIFT + 0.003).at)
      kit.addWorld(bone, 'trim', tube(ring, 0.016, 120))
    }
    return
  }

  if (n >= 2) {
    // Lapels: a raised V either side of the opening, from the collar to mid chest.
    const vBottom = hem + height * (n >= 4 ? 0.5 : 0.56)
    kit.puff(bone, 'fabric', (_p, w) => {
      const phi = fromFront(host, w)
      const t = smooth(vBottom, top, w.y)
      // The lapel widens toward the collar.
      return (LIFT + 0.012) * Math.min(within(phi, 0.06, 0.12 + 0.5 * t, 0.04), within(w.y, vBottom, top - 0.02, 0.03))
    })
    for (const { s } of SIDES) {
      kit.addWorld(bone, 'trim', seam(host, [top - 0.02, s * 0.62], [vBottom, s * 0.08], LIFT + 0.013, 0.007, 12))
    }
    // The opening down the front, and buttons beside it.
    kit.addWorld(bone, 'trim', seam(host, [vBottom, 0], [hem + 0.01, 0], LIFT + 0.002, 0.006, 8))
    const rows = n >= 4 ? [-0.16, 0.16] : [0.09]
    for (const phi of rows) {
      for (let i = 0; i < 3; i++) {
        const y = vBottom - 0.04 - i * ((vBottom - hem) / 3.4)
        const at = onBody(host, y, phi, LIFT + 0.004)
        kit.addWorld(bone, 'dark', stud(at.at, at.normal, 0.016))
      }
    }
  }

  if (n === 3) {
    // A turtleneck under the coat, filling the collar.
    const neck: Vector3[] = []
    for (let i = 0; i <= 40; i++) neck.push(onBody(host, top - 0.015, -Math.PI + (i / 40) * Math.PI * 2, LIFT + 0.01).at)
    kit.addWorld(bone, 'dark', tube(neck, 0.035, 120))
  }

  if (n >= 4) {
    // A belt at the waist with a buckle in front.
    const ring: Vector3[] = []
    for (let i = 0; i <= 40; i++) ring.push(onBody(host, belt, -Math.PI + (i / 40) * Math.PI * 2, LIFT + 0.006).at)
    kit.addWorld(bone, 'trim', tube(ring, 0.022, 120))
    const buckle = onBody(host, belt, 0, LIFT + 0.03)
    kit.addWorld(bone, 'dark', stud(buckle.at, buckle.normal, 0.04, 0.034, 0.014))
  }

  // A trench reaches below the knee, a heavy coat to the knee, a clinic coat to mid thigh.
  if (motif === 'coat') skirt(kit, wear, hem, wear.leg.thigh + wear.leg.shin * (n >= 4 ? 0.55 : n === 3 ? 0.3 : -0.25))
}

/**
 * The coat below the torso: a ring round the hem, carried down and out so it hangs round the
 * outside of the walking legs, wherever the species and build put them, with a little room to
 * spare. It rides the torso bone, open a little at the front so the legs show as it walks.
 */
function skirt(kit: Kit, wear: Wearable, hem: number, drop: number): void {
  const { loft: host, bone } = wear.torso
  const length = drop
  const cols = 64
  const rows = 12
  const split = 0.16
  const top = hem + 0.01
  const k = host.key(host.sAt(top))
  const cx = k.x ?? 0
  const cz = k.z ?? 0
  const verts: number[] = []
  const index: number[] = []
  const ring = Array.from({ length: cols + 1 }, (_, c) => {
    const phi = split + (c / cols) * (Math.PI * 2 - split * 2)
    return onBody(host, top, phi > Math.PI ? phi - Math.PI * 2 : phi, LIFT + 0.004).at
  })
  const legs = legLines(kit)
  const room = wear.leg.radius * 1.25 + 0.035
  let prev: number[] = []
  for (let r = 0; r <= rows; r++) {
    const t = r / rows
    const y = top - length * t
    // How far out each column hangs: a gentle flare, pushed further wherever a leg is in the way.
    const reach = ring.map((p) => {
      const dx = p.x - cx
      const dz = p.z - cz
      const base = Math.hypot(dx, dz)
      const ux = dx / base
      const uz = dz / base
      let need = base * (1 + 0.32 * t * t + 0.05 * t)
      for (const at of legs) {
        const leg = at(y)
        if (!leg) continue
        const lx = leg.x - cx
        const lz = leg.z - cz
        const along = lx * ux + lz * uz
        const off = Math.abs(lx * uz - lz * ux)
        // Wide of the leg, the cloth still has to curve round it, so the clearance fades out.
        const wide = room * 2.2
        if (along > 0 && off < wide) need = Math.max(need, along + Math.sqrt(Math.max(0, wide * wide - off * off)) * (room / wide) + room * 0.25)
      }
      return need
    })
    // Smooth round the ring (never pulling in past a leg), and never narrower than the row above.
    for (let pass = 0; pass < 4; pass++) {
      const copy = reach.slice()
      for (let c = 0; c <= cols; c++) reach[c] = Math.max(copy[c], (copy[Math.max(0, c - 1)] + copy[c] * 2 + copy[Math.min(cols, c + 1)]) / 4)
    }
    if (prev.length) for (let c = 0; c <= cols; c++) reach[c] = Math.max(reach[c], prev[c])
    prev = reach
    ring.forEach((p, c) => {
      const dx = p.x - cx
      const dz = p.z - cz
      const base = Math.hypot(dx, dz)
      verts.push(cx + (dx / base) * reach[c], y, cz + (dz / base) * reach[c])
    })
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c
      const b = a + cols + 1
      index.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array(verts), 3))
  geo.setIndex(index)
  // A second skin just inside, facing in, so the coat has a lining from behind.
  const inner = geo.clone()
  const pos = inner.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const x = cx + (pos.getX(i) - cx) * 0.985
    const z = cz + (pos.getZ(i) - cz) * 0.985
    pos.setXYZ(i, x, pos.getY(i), z)
  }
  const flipped: number[] = []
  for (let i = 0; i < index.length; i += 3) flipped.push(index[i], index[i + 2], index[i + 1])
  inner.setIndex(flipped)
  for (const g of [geo, inner]) {
    const welded = mergeVertices(g, 1e-5)
    welded.computeVertexNormals()
    kit.addWorld(bone, g === geo ? 'fabric' : 'dark', welded)
  }
  // Hem line along the bottom edge.
  const edge: Vector3[] = []
  for (let c = 0; c <= cols; c += 2) {
    const i = (rows * (cols + 1) + c) * 3
    edge.push(v(verts[i], verts[i + 1], verts[i + 2]))
  }
  kit.addWorld(bone, 'trim', tube(edge, 0.008, 96))
}

/**
 * Each walking leg as a line from hip to knee to ankle at rest (character space), so a coat can hang
 * clear of it. Returns where the leg's centre is at a given height, or nothing above the hip.
 */
function legLines(kit: Kit): ((y: number) => Vector3 | null)[] {
  const { root } = kit.rig
  root.updateMatrixWorld(true)
  const bone = (name: string) => kit.rig.bones.get(name)
  const at = (name: string) => {
    const node = bone(name)
    return node && root.worldToLocal(node.getWorldPosition(new Vector3()))
  }
  return SIDES.flatMap(({ tag }) => {
    const pts = [at(`thigh${tag}`), at(`shin${tag}`), at(`foot${tag}`)]
    if (pts.some((p) => !p)) return []
    const [hip, knee, ankle] = pts as Vector3[]
    return [
      (y: number) => {
        if (y > hip.y) return null
        const [a, b] = y > knee.y ? [hip, knee] : [knee, ankle]
        const k = Math.min(1, Math.max(0, (a.y - y) / (a.y - b.y)))
        return a.clone().lerp(b, k)
      },
    ]
  })
}

/** Shoes: `clog` (a rounded slip-on with a thick sole) or `hi-top` (up over the ankle, laced). */
export function shoes(kit: Kit, wear: Wearable): void {
  const { ankle, shin, footLength } = wear.leg
  const { motif, construction: n } = kit.visual
  const hiTop = motif === 'hi-top'
  for (const { tag } of SIDES) {
    // Upper over the whole foot.
    kit.puff(`foot${tag}`, 'paint', () => 0.022)
    // Sole: the underside, pushed further.
    kit.puff(`foot${tag}`, 'trim', (_p, _w, nm) => 0.04 * above(-nm.y, 0.55, 0.2))
    if (hiTop) {
      kit.puff(`shin${tag}`, 'paint', (p) => 0.022 * below(p.y, -shin * 0.72, 0.03))
      // Laces up the front.
      const R = wear.leg.radius + 0.03
      for (let i = 0; i < 3; i++) {
        const y = -shin * (0.8 + i * 0.06)
        kit.add(`shin${tag}`, 'accent', tube([v(-R * 0.4, y, R * 0.92), v(0, y - 0.006, R * 1.02), v(R * 0.4, y, R * 0.92)], 0.006, 8))
      }
      if (n >= 2) {
        // Stickers on the heel.
        kit.add(`shin${tag}`, 'trim', stud(v(0, -shin * 0.86, -R), v(0, 0, -1), 0.03))
        kit.add(`shin${tag}`, 'accent', stud(v(R * 0.6, -shin * 0.8, -R * 0.75), v(0.6, 0, -0.8), 0.022))
      }
    } else {
      // A strap across the back of the heel.
      kit.puff(`foot${tag}`, 'trim', (p) => 0.03 * Math.min(below(p.z, -footLength * 0.1, 0.03), within(p.y, -ankle * 0.6, -ankle * 0.2, 0.02)))
    }
  }
}
