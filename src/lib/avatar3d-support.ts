/**
 * Whether this browser can draw the 3D character. Kept apart from the renderer so asking the
 * question never downloads it. When the answer is no, every avatar stays on the 2D drawing.
 */
let supported: boolean | null = null
const listeners = new Set<() => void>()

function probe(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (!gl) return false
    // Hand the test context straight back: browsers only allow a handful at once.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

/** Browser only. The first call tests the browser; later calls reuse the answer. */
export function can3D(): boolean {
  if (supported === null) supported = probe()
  return supported
}

/** The answer so far, without testing: true until the browser has been found wanting. */
export function known3D(): boolean {
  return supported !== false
}

/** Call when 3D failed in use (no context, or the context was lost): the page falls back to 2D. */
export function mark3DUnavailable(): void {
  if (supported === false) return
  supported = false
  for (const listener of listeners) listener()
}

export function subscribe3DSupport(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function set3DSupportForTests(value: boolean | null): void {
  supported = value
  for (const listener of listeners) listener()
}
