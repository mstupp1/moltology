/** Small vector helpers for building clean, tapered SVG limbs. */

export type Pt = readonly [number, number]

const r2 = (n: number) => Math.round(n * 100) / 100

function cubicAt(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): [number, number] {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]
}

/**
 * Filled outline of a cubic curve whose width tapers from `w0` to `w1`, with round caps.
 * Gives limbs and antennae a hand-inked look that plain strokes cannot.
 */
export function taperedCurve(p0: Pt, p1: Pt, p2: Pt, p3: Pt, w0: number, w1: number, samples = 18): string {
  const pts: [number, number][] = []
  for (let i = 0; i <= samples; i++) pts.push(cubicAt(p0, p1, p2, p3, i / samples))
  const left: [number, number][] = []
  const right: [number, number][] = []
  for (let i = 0; i <= samples; i++) {
    const prev = pts[Math.max(0, i - 1)]
    const next = pts[Math.min(samples, i + 1)]
    let dx = next[0] - prev[0]
    let dy = next[1] - prev[1]
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    const w = (w0 + (w1 - w0) * (i / samples)) / 2
    left.push([pts[i][0] - dy * w, pts[i][1] + dx * w])
    right.push([pts[i][0] + dy * w, pts[i][1] - dx * w])
  }
  const endR = Math.max(0.2, w1 / 2)
  const startR = Math.max(0.2, w0 / 2)
  let d = `M${r2(left[0][0])},${r2(left[0][1])}`
  for (let i = 1; i <= samples; i++) d += `L${r2(left[i][0])},${r2(left[i][1])}`
  d += `A${r2(endR)},${r2(endR)} 0 0 0 ${r2(right[samples][0])},${r2(right[samples][1])}`
  for (let i = samples - 1; i >= 0; i--) d += `L${r2(right[i][0])},${r2(right[i][1])}`
  d += `A${r2(startR)},${r2(startR)} 0 0 0 ${r2(left[0][0])},${r2(left[0][1])}Z`
  return d
}

/** Mirror an x coordinate across the character's centre line. */
export const mirrorX = (x: number, cx = 50) => 2 * cx - x

/** Mirror every x in a flat "x,y x,y" or path string that only uses absolute M/L/C/Q/Z commands. */
export function mirrorPath(d: string, cx = 50): string {
  return d.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (_m, x: string, y: string) => `${r2(mirrorX(Number(x), cx))},${y}`)
}

export { r2 }
