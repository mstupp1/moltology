/**
 * Browser side of the animation renderer: bundled by render.ts and run in headless Chrome. It
 * builds one manual stage the size of the video and hands back each frame as a PNG.
 */
import { createStage, type Stage } from '../../../src/lib/avatar3d/stage'
import { timelinePlayer, type AnimationTimeline } from '../../../src/lib/avatar3d/scripted'

declare global {
  interface Window {
    __anim: {
      setup: (timeline: AnimationTimeline, options?: { shadows?: boolean }) => Promise<void>
      frame: (index: number) => string
    }
  }
}

let stage: Stage | null = null
let player: ReturnType<typeof timelinePlayer> | null = null
let canvas: HTMLCanvasElement | null = null

window.__anim = {
  async setup(timeline, options) {
    canvas = document.createElement('canvas')
    canvas.width = timeline.width
    canvas.height = timeline.height
    canvas.style.width = `${timeline.width}px`
    canvas.style.height = `${timeline.height}px`
    document.body.appendChild(canvas)
    stage = createStage(canvas, { manual: true, preserveDrawingBuffer: true, pixelRatio: 1, lighting: timeline.lighting ?? 'cinematic', quality: 'high', shadows: options?.shadows })
    player = timelinePlayer(stage, timeline)
    await player.ready
  },
  frame(index) {
    if (!player || !canvas) throw new Error('setup() first')
    player.seek(index)
    return canvas.toDataURL('image/png')
  },
}
