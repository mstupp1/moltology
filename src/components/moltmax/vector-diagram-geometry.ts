/** Geometry for the five vectors diagram. Axis order matches QuizRadarChart so the preview reads like the real result. */

export const VECTOR_COUNT = 5
export const DIAGRAM_SIZE = 400
export const DIAGRAM_CENTER = DIAGRAM_SIZE / 2
/** Radius of the 100% ring. */
export const DIAGRAM_RADIUS = 136
/** Radius the node buttons sit on, outside the 100% ring. */
export const NODE_RADIUS = 168

/** A plausible mid-molt reading, so the shape looks like a real profile rather than a regular pentagon. */
export const SAMPLE_SHELL = [64, 50, 72, 44, 58] as const

export function axisAngle(index: number): number {
  return -Math.PI / 2 + (index * Math.PI * 2) / VECTOR_COUNT
}

export function axisAngleDegrees(index: number): number {
  return (index * 360) / VECTOR_COUNT
}

export function polarPoint(index: number, value: number, radius = DIAGRAM_RADIUS, center = DIAGRAM_CENTER): [number, number] {
  const angle = axisAngle(index)
  const distance = radius * (value / 100)
  return [center + Math.cos(angle) * distance, center + Math.sin(angle) * distance]
}

export function pointsAttr(values: readonly number[]): string {
  return values.map((value, index) => polarPoint(index, value).map((n) => n.toFixed(2)).join(',')).join(' ')
}

/** Node position as a percentage of the diagram box, for absolutely positioned HTML buttons. */
export function nodePosition(index: number): { left: string; top: string } {
  const [x, y] = polarPoint(index, 100, NODE_RADIUS)
  return { left: `${((x / DIAGRAM_SIZE) * 100).toFixed(3)}%`, top: `${((y / DIAGRAM_SIZE) * 100).toFixed(3)}%` }
}

/** The sample shell with the active vector pushed out, so the shape shows which axis that trait moves. */
export function shapeFor(active: number | null): number[] {
  return SAMPLE_SHELL.map((value, index) => {
    if (active === null) return value
    return index === active ? 96 : Math.round(value * 0.82)
  })
}

/** Pie wedge around one axis, from the centre out past the 100% ring. Used as a hover target and highlight. */
export function wedgePath(index: number, radius = DIAGRAM_RADIUS + 18, center = DIAGRAM_CENTER): string {
  const half = Math.PI / VECTOR_COUNT
  const start = axisAngle(index) - half
  const end = axisAngle(index) + half
  const sx = center + Math.cos(start) * radius
  const sy = center + Math.sin(start) * radius
  const ex = center + Math.cos(end) * radius
  const ey = center + Math.sin(end) * radius
  return `M${center},${center} L${sx.toFixed(2)},${sy.toFixed(2)} A${radius},${radius} 0 0 1 ${ex.toFixed(2)},${ey.toFixed(2)} Z`
}

export function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t))
  return 1 - Math.pow(1 - clamped, 3)
}

export function lerpValues(from: readonly number[], to: readonly number[], t: number): number[] {
  return to.map((target, index) => {
    const start = from[index] ?? target
    return start + (target - start) * t
  })
}

export function wrapIndex(index: number, count = VECTOR_COUNT): number {
  return ((index % count) + count) % count
}
