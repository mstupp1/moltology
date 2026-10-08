import { buildShell, mulberry32, type ShellCloud } from './shell'

/**
 * Homepage hero particles. The field opens as flickering static, then calms: most of it is
 * pulled in plate by plate to calcify into a slowly turning shell, and the rest settles into
 * slow drifting motes that stream around the shell instead of through it. New noise keeps
 * arriving from the left edge and quiets as it passes.
 *
 * Canvas 2D only. Points are batched by colour, so a frame is a few dozen fills. The loop
 * stops while the hero is off screen or the tab is hidden, and reduced motion gets one still
 * frame of the finished shell.
 */

export interface HeroParticlesOptions {
  canvas: HTMLCanvasElement
  /** Element whose box the shell is drawn into. Its `--shell-dim` CSS variable (0..1) dims the field. */
  anchor: HTMLElement
  /** Element that listens for the pointer, for a little parallax. */
  host?: HTMLElement | null
  reducedMotion?: boolean
  /** 0..1 share of the full particle budget, lower on low-end devices. */
  budget?: number
  /** Skip the static-to-shell opening and start already formed. */
  skipIntro?: boolean
  /** Called once the first frame is on the canvas. */
  onReady?: () => void
}

export interface HeroParticlesHandle {
  destroy: () => void
}

// Colour families, each pre-rendered at LEVELS alpha steps so a frame needs one fill per bucket.
const FAMILIES = [
  [214, 222, 230], // 0 static, grey-white
  [255, 96, 80], // 1 static, coral
  [70, 225, 255], // 2 shell
  [255, 178, 120], // 3 glint, the warm light that sweeps the shell
  [120, 190, 215], // 4 calm drift
] as const
const FAMILY_MAX_ALPHA = [0.85, 0.9, 1, 1, 0.42]
const LEVELS = 10
const BUCKETS = FAMILIES.length * LEVELS

const INTRO_HOLD = 0.75
const GROW_SPAN = 2.6
const CAMERA = 3.4

export function startHeroParticles(opts: HeroParticlesOptions): HeroParticlesHandle | null {
  const { canvas, anchor } = opts
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return null

  const styles: string[] = []
  for (let f = 0; f < FAMILIES.length; f++) {
    const [r, g, b] = FAMILIES[f]
    for (let l = 0; l < LEVELS; l++) {
      const a = ((l + 1) / LEVELS) * FAMILY_MAX_ALPHA[f]
      styles.push(`rgba(${r},${g},${b},${a.toFixed(3)})`)
    }
  }

  const rand = mulberry32(20261008)
  let width = 0
  let height = 0
  let dpr = 1
  let cx = 0
  let cy = 0
  let scale = 1
  let pointScale = 1
  let dim = 1

  let shell: ShellCloud = buildShell(0)
  let shellN = 0
  let ambientN = 0
  let total = 0
  // Per particle state (structure of arrays). Shell particles come first, then ambient ones.
  let px = new Float32Array(0)
  let py = new Float32Array(0)
  let vx = new Float32Array(0)
  let vy = new Float32Array(0)
  let start = new Float32Array(0)
  let agitation = new Float32Array(0)
  let hue = new Uint8Array(0)
  let seedPhase = new Float32Array(0)
  // Per frame draw lists.
  let drawX = new Float32Array(0)
  let drawY = new Float32Array(0)
  let drawW = new Float32Array(0)
  let drawH = new Float32Array(0)
  let shade = new Float32Array(0)
  let bucketOf = new Uint8Array(0)
  let sorted = new Uint32Array(0)
  const bucketCount = new Uint32Array(BUCKETS)
  const bucketStart = new Uint32Array(BUCKETS + 1)

  let time = opts.skipIntro || opts.reducedMotion ? 30 : 0
  // The shell only grows while its box is on screen, so on phones (where it sits below the
  // copy) the calcification plays when it is scrolled to instead of out of sight.
  let growClock = time
  let anchorSeen = false
  let lastFrame = 0
  let raf = 0
  let visible = true
  let destroyed = false
  let readySent = false
  let pointerX = 0
  let pointerY = 0
  let easedX = 0
  let easedY = 0
  let slowFrames = 0
  let stride = 1
  /** Jitter source; still frames swap in a seeded one so they are stable. */
  let noise: () => number = Math.random
  // Scroll: the shell turns and lags behind the page as the hero scrolls away.
  let canvasTop = 0
  let scrollEased = 0
  // A tap or click sends a ring of noise out from the pointer; the shell flares as it holds.
  let pulseX = 0
  let pulseY = 0
  let pulseAge = Infinity
  let flash = 0

  function measure() {
    const rect = canvas.getBoundingClientRect()
    const a = anchor.getBoundingClientRect()
    canvasTop = rect.top + window.scrollY
    width = Math.max(1, rect.width)
    height = Math.max(1, rect.height)
    dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    cx = a.left - rect.left + a.width / 2
    scale = Math.min(a.width, a.height) * 0.54
    pointScale = Math.min(1, Math.max(0.65, scale / 300))
    // The antennae sweep high, so the body sits below the cloud's centre; lift it to the middle.
    cy = a.top - rect.top + a.height / 2 - scale * 0.12
    const raw = parseFloat(getComputedStyle(anchor).getPropertyValue('--shell-dim'))
    dim = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 1
  }

  function allocate(formed: boolean) {
    const area = width * height
    const budget = Math.min(1, Math.max(0.3, opts.budget ?? 1))
    total = Math.round(Math.min(4200, Math.max(1400, area / 320)) * budget)
    shellN = Math.round(total * 0.68)
    ambientN = total - shellN
    shell = buildShell(shellN)
    px = new Float32Array(total)
    py = new Float32Array(total)
    vx = new Float32Array(total)
    vy = new Float32Array(total)
    start = new Float32Array(total)
    agitation = new Float32Array(total)
    hue = new Uint8Array(total)
    seedPhase = new Float32Array(total)
    drawX = new Float32Array(total)
    drawY = new Float32Array(total)
    drawW = new Float32Array(total)
    drawH = new Float32Array(total)
    shade = new Float32Array(total)
    bucketOf = new Uint8Array(total)
    sorted = new Uint32Array(total)
    for (let i = 0; i < total; i++) {
      px[i] = rand() * width
      py[i] = rand() * height
      vx[i] = (rand() - 0.5) * 40
      vy[i] = (rand() - 0.5) * 40
      hue[i] = rand() < 0.22 ? 1 : 0
      seedPhase[i] = rand() * Math.PI * 2
      if (i < shellN) {
        start[i] = INTRO_HOLD + shell.order[i] * GROW_SPAN + rand() * 0.35
        agitation[i] = 1
      } else {
        start[i] = INTRO_HOLD + 0.3 + rand() * 1.6
        agitation[i] = formed ? rand() * 0.15 : 1
      }
    }
    if (formed) {
      project(0)
      for (let i = 0; i < shellN; i++) {
        px[i] = drawX[i]
        py[i] = drawY[i]
        vx[i] = 0
        vy[i] = 0
        agitation[i] = 0
      }
    }
  }

  let lastWidth = 0
  function resize() {
    measure()
    if (!lastWidth || Math.abs(width - lastWidth) / lastWidth > 0.2) {
      allocate(lastWidth > 0 || growClock > 10)
      lastWidth = width
    }
    if (opts.reducedMotion || !raf) render(0)
  }

  // Rotation for the current frame, cached by project().
  let m00 = 1, m01 = 0, m02 = 0, m10 = 0, m11 = 1, m12 = 0, m20 = 0, m21 = 0, m22 = 1
  let bob = 0

  function orient() {
    // A three-quarter view from above, head upper left, turning slowly back and forth.
    const yaw = -0.75 + Math.sin(time * 0.21) * 0.28 + easedX * 0.22 + scrollEased * 0.9
    const pitch = -0.5 + Math.sin(time * 0.17 + 1) * 0.07 + easedY * 0.12 - scrollEased * 0.35
    const roll = Math.sin(time * 0.13) * 0.05
    const cyw = Math.cos(yaw), syw = Math.sin(yaw)
    const cp = Math.cos(pitch), sp = Math.sin(pitch)
    const cr = Math.cos(roll), sr = Math.sin(roll)
    // R = Rz(roll) * Rx(pitch) * Ry(yaw)
    const a00 = cyw, a01 = 0, a02 = syw
    const a10 = sp * syw, a11 = cp, a12 = -sp * cyw
    const a20 = -cp * syw, a21 = sp, a22 = cp * cyw
    m00 = cr * a00 - sr * a10; m01 = cr * a01 - sr * a11; m02 = cr * a02 - sr * a12
    m10 = sr * a00 + cr * a10; m11 = sr * a01 + cr * a11; m12 = sr * a02 + cr * a12
    m20 = a20; m21 = a21; m22 = a22
    bob = Math.sin(time * 0.6) * scale * 0.025 + scrollEased * height * 0.22
  }

  /** Projects shell targets into drawX/drawY and returns nothing; depth lands in drawW. */
  function project(_dt: number) {
    orient()
    for (let i = 0; i < shellN; i++) {
      const x = shell.x[i], y = shell.y[i], z = shell.z[i]
      const X = m00 * x + m01 * y + m02 * z
      const Y = m10 * x + m11 * y + m12 * z
      const Z = m20 * x + m21 * y + m22 * z
      const s = CAMERA / (CAMERA - Z)
      drawX[i] = cx + X * s * scale
      drawY[i] = cy + Y * s * scale + bob
      drawW[i] = Z // -1 far .. 1 near
      // Light from the upper left and slightly in front; points turned away fall into shadow.
      const ex = shell.nx[i], ey = shell.ny[i], ez = shell.nz[i]
      if (ex === 0 && ey === 0 && ez === 0) shade[i] = 0.8
      else {
        const NX = m00 * ex + m01 * ey + m02 * ez
        const NY = m10 * ex + m11 * ey + m12 * ez
        const NZ = m20 * ex + m21 * ey + m22 * ez
        const facing = Math.max(0, NZ)
        const diffuse = Math.max(0, -0.45 * NX - 0.6 * NY + 0.66 * NZ)
        shade[i] = 0.12 + 0.5 * diffuse + 0.38 * facing
      }
    }
  }

  function step(dt: number) {
    time += dt
    if (anchorSeen) growClock += dt
    easedX += (pointerX - easedX) * Math.min(1, dt * 2.5)
    easedY += (pointerY - easedY) * Math.min(1, dt * 2.5)
    const scrolled = Math.min(1, Math.max(0, (window.scrollY - canvasTop) / height))
    scrollEased += (scrolled - scrollEased) * Math.min(1, dt * 6)
    pulseAge += dt
    const pulseR = pulseAge * 620
    const pulseLive = pulseAge < 1.6
    if (pulseLive) {
      const reach = Math.hypot(cx - pulseX, cy - pulseY) - scale * 0.6
      const hit = Math.exp(-(((pulseR - reach) / 140) ** 2))
      flash = Math.max(flash * Math.exp(-dt * 3), hit)
    } else flash *= Math.exp(-dt * 3)
    project(dt)

    const sweep = ((time * 0.16) % 1.6) - 0.3
    const jitterAmp = 7
    const k = 30
    const damping = 8.2

    // Shell particles: static until their plate's turn, then pulled onto it.
    for (let i = 0; i < shellN; i++) {
      const tx = drawX[i]
      const ty = drawY[i]
      const depth = drawW[i]
      const since = growClock - start[i]
      let ag = 1
      if (since > 0) {
        ag = Math.exp(-since * 2.4)
        const ax = (tx - px[i]) * k
        const ay = (ty - py[i]) * k
        // A brief swirl as they come in, so they spiral onto the plate instead of snapping.
        const swirl = 2.4 * ag
        vx[i] += (ax - vx[i] * damping - (ty - py[i]) * swirl) * dt
        vy[i] += (ay - vy[i] * damping + (tx - px[i]) * swirl) * dt
        px[i] += vx[i] * dt
        py[i] += vy[i] * dt
      } else {
        px[i] += vx[i] * dt * 0.4
        py[i] += vy[i] * dt * 0.4
      }
      agitation[i] = ag
      const near = (depth + 1) / 2
      const jit = ag * jitterAmp
      if (ag > 0.45) {
        // Static: short flickering dashes.
        drawX[i] = px[i] + (noise() - 0.5) * jit * 2
        drawY[i] = py[i] + (noise() - 0.5) * jit
        drawW[i] = 1.4 + noise() * 4.2
        drawH[i] = 1.1
        const flick = noise()
        bucketOf[i] = hue[i] * LEVELS + Math.min(LEVELS - 1, Math.floor((0.3 + 0.7 * flick) * LEVELS * dim))
      } else {
        drawX[i] = px[i] + (noise() - 0.5) * jit
        drawY[i] = py[i] + (noise() - 0.5) * jit
        const lit = shell.rim[i]
        const size = (1 + near * 1.3 + lit * 0.4) * pointScale
        drawW[i] = size
        drawH[i] = size
        const glint = Math.exp(-((shell.along[i] - sweep) ** 2) / 0.006)
        let lum = (0.25 + 0.75 * lit) * (0.45 + 0.55 * near) * (0.25 + 0.95 * shade[i]) * (0.8 + 0.2 * Math.sin(time * 1.3 + seedPhase[i]))
        let family = 2
        const flare = flash * lit
        if (glint * lit > 0.35 || flare > 0.45) {
          family = 3
          lum = Math.min(1, lum + glint * 0.5 + flare * 0.6)
        }
        lum = Math.min(1, lum * 1.45) * (1 - ag * 0.6) * dim
        bucketOf[i] = family * LEVELS + Math.min(LEVELS - 1, Math.max(0, Math.floor(lum * LEVELS)))
      }
    }

    // Ambient particles: noise that calms into slow drift and flows around the shell.
    const rx = scale * 1.1
    const ry = scale * 0.8
    const pxPointer = width / 2 + pointerX * width / 2
    const pyPointer = height / 2 + pointerY * height / 2
    for (let i = shellN; i < total; i += stride) {
      const settled = time > start[i]
      if (settled) agitation[i] *= Math.exp(-dt * 0.75)
      const ag = agitation[i]
      const t = time * 0.25 + seedPhase[i]
      const fx = (14 + 16 * Math.sin(py[i] * 0.0065 + t) * (0.4 + ag)) * (1 + scrollEased * 2.5)
      const fy = 9 * Math.cos(px[i] * 0.0052 - t * 0.8)
      vx[i] += (fx - vx[i]) * dt * 0.9
      vy[i] += (fy - vy[i]) * dt * 0.9

      // Deflect off the shell: push out along the ellipse normal and around it.
      const dx = px[i] - cx
      const dy = py[i] - cy
      const e = Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
      if (e < 1.35 && e > 0.001) {
        const push = (1.35 - e) * 210
        const nx = dx / (e * rx)
        const ny = dy / (e * ry)
        const len = Math.hypot(nx, ny) || 1
        vx[i] += (nx / len) * push * dt * 1.4 - (ny / len) * push * dt * 0.6 * Math.sign(dy || 1)
        vy[i] += (ny / len) * push * dt * 1.4
        if (e < 1.1) agitation[i] *= Math.exp(-dt * 2)
      }
      if (pulseLive) {
        const qx = px[i] - pulseX
        const qy = py[i] - pulseY
        const d = Math.hypot(qx, qy) || 1
        const band = Math.abs(d - pulseR)
        if (band < 36) {
          const f = (1 - band / 36) * 380
          vx[i] += (qx / d) * f * dt
          vy[i] += (qy / d) * f * dt
          agitation[i] = Math.max(agitation[i], 0.85 * (1 - pulseAge / 1.6))
        }
      }
      if (hasPointer) {
        const qx = px[i] - pxPointer
        const qy = py[i] - pyPointer
        const d2 = qx * qx + qy * qy
        if (d2 < 9000 && d2 > 1) {
          const d = Math.sqrt(d2)
          const f = (95 - d) * 3
          vx[i] += (qx / d) * f * dt
          vy[i] += (qy / d) * f * dt
        }
      }
      px[i] += vx[i] * dt
      py[i] += vy[i] * dt

      // New noise arrives from the left edge as the old drifts out on the right.
      if (px[i] > width + 12 || py[i] < -40 || py[i] > height + 40) {
        px[i] = -10 - noise() * 40
        py[i] = noise() * height
        vx[i] = 30 + noise() * 30
        agitation[i] = noise() < 0.6 ? 1 : 0.4
      } else if (px[i] < -60) {
        px[i] = width + 10
      }

      const jit = ag * jitterAmp
      drawX[i] = px[i] + (noise() - 0.5) * jit * 2
      drawY[i] = py[i] + (noise() - 0.5) * jit
      if (ag > 0.45) {
        drawW[i] = 1.4 + noise() * 4.2
        drawH[i] = 1.1
        const flick = noise()
        bucketOf[i] = hue[i] * LEVELS + Math.min(LEVELS - 1, Math.floor((0.3 + 0.7 * flick) * LEVELS * dim))
      } else {
        const size = 1 + (i % 3) * 0.35
        drawW[i] = size
        drawH[i] = size
        const lum = (0.35 + 0.25 * Math.sin(time * 0.9 + seedPhase[i]) + ag) * dim
        bucketOf[i] = 4 * LEVELS + Math.min(LEVELS - 1, Math.max(0, Math.floor(lum * LEVELS)))
      }
    }
  }

  function render(dt: number) {
    if (dt > 0) step(dt)
    else {
      // A still frame (first paint, resize or reduced motion): settle in place without jitter.
      project(0)
      for (let i = 0; i < shellN; i++) {
        if (growClock > start[i] + 3) {
          px[i] = drawX[i]
          py[i] = drawY[i]
        }
      }
      noise = mulberry32(7)
      step(0)
      noise = Math.random
    }

    bucketCount.fill(0)
    for (let i = 0; i < total; i += i < shellN ? 1 : stride) bucketCount[bucketOf[i]]++
    bucketStart[0] = 0
    for (let b = 0; b < BUCKETS; b++) bucketStart[b + 1] = bucketStart[b] + bucketCount[b]
    bucketCount.fill(0)
    for (let i = 0; i < total; i += i < shellN ? 1 : stride) {
      const b = bucketOf[i]
      sorted[bucketStart[b] + bucketCount[b]++] = i
    }

    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx!.clearRect(0, 0, width, height)
    ctx!.globalCompositeOperation = 'lighter'
    for (let b = 0; b < BUCKETS; b++) {
      const from = bucketStart[b]
      const to = bucketStart[b + 1]
      if (from === to) continue
      ctx!.fillStyle = styles[b]
      ctx!.beginPath()
      for (let j = from; j < to; j++) {
        const i = sorted[j]
        ctx!.rect(drawX[i] - drawW[i] / 2, drawY[i] - drawH[i] / 2, drawW[i], drawH[i])
      }
      ctx!.fill()
    }
    ctx!.globalCompositeOperation = 'source-over'

    if (!readySent) {
      readySent = true
      opts.onReady?.()
    }
  }

  function frameLoop(now: number) {
    raf = 0
    if (destroyed || !visible) return
    const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 1 / 60
    lastFrame = now
    // If the device can't keep up once the shell has formed, draw half the drifting motes.
    if (time > 6 && stride === 1) {
      slowFrames = dt > 0.026 ? slowFrames + 1 : Math.max(0, slowFrames - 1)
      if (slowFrames > 45) stride = 2
    }
    render(dt)
    raf = requestAnimationFrame(frameLoop)
  }

  function play() {
    if (opts.reducedMotion || destroyed || raf || !visible || document.hidden) return
    lastFrame = 0
    raf = requestAnimationFrame(frameLoop)
  }

  function pause() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  let hasPointer = false
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const rect = canvas.getBoundingClientRect()
    hasPointer = true
    pointerX = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1
    pointerY = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1
  }
  const onDown = (e: PointerEvent) => {
    const target = e.target as Element | null
    if (target?.closest?.('a, button, input, textarea, select, label, [role="button"]')) return
    const rect = canvas.getBoundingClientRect()
    pulseX = e.clientX - rect.left
    pulseY = e.clientY - rect.top
    pulseAge = 0
  }
  const onLeave = () => {
    hasPointer = false
    pointerX = 0
    pointerY = 0
  }
  const onVisibility = () => (document.hidden ? pause() : play())

  resize()
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => resize()) : null
  resizeObserver?.observe(canvas)
  resizeObserver?.observe(anchor)
  const io =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver((entries) => {
          visible = entries.some((entry) => entry.isIntersecting)
          if (visible) play()
          else pause()
        })
      : null
  io?.observe(canvas)
  const anchorIo =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            anchorSeen = true
            anchorIo?.disconnect()
          }
        }, { threshold: 0.3 })
      : null
  if (anchorIo) anchorIo.observe(anchor)
  else anchorSeen = true
  document.addEventListener('visibilitychange', onVisibility)
  if (!opts.reducedMotion) {
    opts.host?.addEventListener('pointermove', onPointer, { passive: true })
    opts.host?.addEventListener('pointerleave', onLeave)
    opts.host?.addEventListener('pointerdown', onDown, { passive: true })
  }
  if (opts.reducedMotion) render(0)
  else play()

  return {
    destroy() {
      destroyed = true
      pause()
      resizeObserver?.disconnect()
      io?.disconnect()
      anchorIo?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      opts.host?.removeEventListener('pointermove', onPointer)
      opts.host?.removeEventListener('pointerleave', onLeave)
      opts.host?.removeEventListener('pointerdown', onDown)
    },
  }
}
