/**
 * Whether this browser should get the WebGL character stage. Kept out of the stage module so
 * callers can check it without loading the renderer.
 */
let cached: boolean | null = null

export function canUseKitStage(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  if (nav.connection?.saveData) return false
  if (cached === null) {
    try {
      const gl = document.createElement('canvas').getContext('webgl2')
      cached = Boolean(gl)
      // Hand the probe's context straight back; browsers cap live contexts per page.
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      cached = false
    }
  }
  return cached
}
