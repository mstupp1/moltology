import { buildShell } from './shell'

/**
 * The small shell that keeps you company down the homepage once the hero has scrolled away.
 * Its plates calcify one section at a time, head first, so by the final call to action the
 * shell is whole. Plates not grown yet show as a faint outline of what is still to come.
 *
 * It only animates while it is shown, and section progress comes from IntersectionObservers,
 * so scrolling never triggers layout reads.
 */

export interface ShellCompanionOptions {
  canvas: HTMLCanvasElement
  /** Element shown and hidden with `data-visible`. */
  frame: HTMLElement
  hero: Element | null
  sections: Element[]
  footer: Element | null
  reducedMotion?: boolean
}

const POINTS = 720
const CAMERA = 3.4
const LEVELS = 8

export function startShellCompanion(opts: ShellCompanionOptions): { destroy: () => void } | null {
  const { canvas, frame } = opts
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const shell = buildShell(POINTS, 11)
  const bornAt = new Float32Array(POINTS).fill(-1)
  const scatterX = new Float32Array(POINTS)
  const scatterY = new Float32Array(POINTS)
  for (let i = 0; i < POINTS; i++) {
    const a = Math.random() * Math.PI * 2
    const r = 0.4 + Math.random() * 0.8
    scatterX[i] = Math.cos(a) * r
    scatterY[i] = Math.sin(a) * r
  }

  const lit: string[] = []
  const warm: string[] = []
  for (let l = 0; l < LEVELS; l++) {
    const a = ((l + 1) / LEVELS).toFixed(3)
    lit.push(`rgba(70,225,255,${a})`)
    warm.push(`rgba(255,178,120,${a})`)
  }
  const ghost = 'rgba(120,190,215,0.3)'

  const size = 132
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = size * dpr
  canvas.height = size * dpr

  let grown = 0
  /** Growth as drawn on the ring, easing toward `grown`. */
  let ring = 0
  let completedAt = -1
  let time = 0
  let last = 0
  let raf = 0
  let shown = false
  let heroVisible = true
  let footerVisible = false
  let destroyed = false
  const passed = new Set<Element>()

  function setGrowth(next: number) {
    if (next <= grown) return
    for (let i = 0; i < POINTS; i++) {
      if (shell.order[i] > grown && shell.order[i] <= next) bornAt[i] = time
    }
    grown = next
    if (grown >= 1 && completedAt < 0) completedAt = time
    if (!raf) {
      ring = grown
      draw()
    }
  }

  function draw() {
    const yaw = -0.75 + (opts.reducedMotion ? 0 : Math.sin(time * 0.35) * 0.35)
    const pitch = -0.5
    const cyw = Math.cos(yaw), syw = Math.sin(yaw)
    const cp = Math.cos(pitch), sp = Math.sin(pitch)
    const m10 = sp * syw, m11 = cp, m12 = -sp * cyw
    const m20 = -cp * syw, m21 = sp, m22 = cp * cyw
    const scale = size * 0.4
    const c = size / 2
    const sweep = completedAt >= 0 ? (time - completedAt) * 0.6 - 0.2 : -9

    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx!.clearRect(0, 0, size, size)
    ctx!.globalCompositeOperation = 'lighter'

    // Outline still to grow, then calcified plates by brightness level.
    const buckets: number[][] = Array.from({ length: LEVELS * 2 + 1 }, () => [])
    const xs = new Float32Array(POINTS)
    const ys = new Float32Array(POINTS)
    const ss = new Float32Array(POINTS)
    for (let i = 0; i < POINTS; i++) {
      const x = shell.x[i], y = shell.y[i], z = shell.z[i]
      const X = cyw * x + syw * z
      const Y = m10 * x + m11 * y + m12 * z
      const Z = m20 * x + m21 * y + m22 * z
      const s = CAMERA / (CAMERA - Z)
      let px = c + X * s * scale
      let py = c + Y * s * scale
      const near = (Z + 1) / 2
      ss[i] = 0.8 + near * 0.9
      if (bornAt[i] < 0) {
        xs[i] = px
        ys[i] = py
        buckets[0].push(i)
        continue
      }
      const age = time - bornAt[i]
      const settle = Math.exp(-age * 3.2)
      px += scatterX[i] * scale * settle
      py += scatterY[i] * scale * settle
      xs[i] = px
      ys[i] = py
      const fresh = Math.exp(-age * 1.6)
      const glint = Math.exp(-((shell.along[i] - sweep) ** 2) / 0.01)
      const lum = Math.min(1, (0.3 + 0.7 * shell.rim[i]) * (0.45 + 0.55 * near) * 1.3 + fresh * 0.5)
      const level = Math.min(LEVELS - 1, Math.floor(lum * LEVELS))
      const isWarm = fresh > 0.35 || glint * shell.rim[i] > 0.35
      buckets[1 + (isWarm ? LEVELS : 0) + level].push(i)
    }
    for (let b = 0; b < buckets.length; b++) {
      const list = buckets[b]
      if (!list.length) continue
      ctx!.fillStyle = b === 0 ? ghost : b <= LEVELS ? lit[b - 1] : warm[b - 1 - LEVELS]
      ctx!.beginPath()
      for (const i of list) {
        const d = b === 0 ? 0.9 : ss[i]
        ctx!.rect(xs[i] - d / 2, ys[i] - d / 2, d, d)
      }
      ctx!.fill()
    }
    ctx!.globalCompositeOperation = 'source-over'

    // A depth gauge around the shell: how much of it has grown so far.
    const r = size / 2 - 3
    ctx!.lineWidth = 1.5
    ctx!.lineCap = 'round'
    ctx!.strokeStyle = 'rgba(120,190,215,0.14)'
    ctx!.beginPath()
    ctx!.arc(c, c, r, 0, Math.PI * 2)
    ctx!.stroke()
    if (ring > 0.002) {
      const done = completedAt >= 0 ? Math.exp(-(time - completedAt) * 0.8) : 0
      ctx!.strokeStyle = done > 0.2 ? `rgba(255,178,120,${0.5 + done * 0.5})` : 'rgba(70,225,255,0.75)'
      ctx!.beginPath()
      ctx!.arc(c, c, r, -Math.PI / 2, -Math.PI / 2 + ring * Math.PI * 2)
      ctx!.stroke()
    }
  }

  function loop(now: number) {
    raf = 0
    if (destroyed || !shown || document.hidden) return
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
    last = now
    time += dt
    ring += (grown - ring) * Math.min(1, dt * 3)
    draw()
    raf = requestAnimationFrame(loop)
  }

  function updateShown() {
    const next = !heroVisible && !footerVisible
    if (next === shown) return
    shown = next
    frame.setAttribute('data-visible', shown ? 'true' : 'false')
    if (shown && !opts.reducedMotion && !raf) {
      last = 0
      raf = requestAnimationFrame(loop)
    } else if (shown) {
      ring = grown
      draw()
    }
  }

  // A section counts as passed once its top has risen past the middle of the screen.
  const sectionIo = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) passed.add(entry.target)
      }
      setGrowth(opts.sections.length ? passed.size / opts.sections.length : 1)
    },
    { rootMargin: '0px 0px -50% 0px' },
  )
  opts.sections.forEach((s) => sectionIo.observe(s))

  const edgeIo = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target === opts.hero) heroVisible = entry.isIntersecting
        if (entry.target === opts.footer) footerVisible = entry.isIntersecting
      }
      updateShown()
    },
    { rootMargin: '0px 0px -35% 0px' },
  )
  if (opts.hero) edgeIo.observe(opts.hero)
  else heroVisible = false
  if (opts.footer) edgeIo.observe(opts.footer)

  const onVisibility = () => {
    if (!document.hidden && shown && !opts.reducedMotion && !raf) {
      last = 0
      raf = requestAnimationFrame(loop)
    }
  }
  document.addEventListener('visibilitychange', onVisibility)
  draw()

  return {
    destroy() {
      destroyed = true
      if (raf) cancelAnimationFrame(raf)
      sectionIo.disconnect()
      edgeIo.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    },
  }
}
