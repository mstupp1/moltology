/** Image-space anchors, four mirrored pairs along the chamber's front rim. */
export const CHAMBER_SOCKETS = [
  { x: 26.9, y: 62.5 },
  { x: 32.3, y: 66.5 },
  { x: 38, y: 69 },
  { x: 44.3, y: 70 },
  { x: 55.7, y: 70 },
  { x: 62, y: 69 },
  { x: 67.7, y: 66.5 },
  { x: 73.1, y: 62.5 },
] as const

/** Fixed, shuffled phases in the 48-frame / four-second loop, indexed by socket. */
export const FLAME_PHASE_FRAMES = [1, 29, 11, 41, 19, 5, 35, 24] as const
export const FLAME_LOOP_SECONDS = 4
export const FLAME_FRAME_COUNT = 48
