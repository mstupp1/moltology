/**
 * Hero water: one WebGL fragment shader drawn over the strip of sea below the horizon. Layered
 * waves seen in perspective give the surface depth; the sky, the moon's glitter path and the
 * shell's glow are reflected off it, and so is the live particle field: each frame a small,
 * downscaled strip of the particle canvas just above the horizon is uploaded as a texture and
 * mirrored, rippled by the wave normals.
 *
 * No library. WebGL 1 so it runs nearly everywhere; without it (or on context loss) the CSS sea
 * underneath stays as it is. Rendered below device resolution, and only when the particle engine
 * draws a frame, so it pauses with it.
 */

export interface HeroWaterOptions {
  /** The canvas to draw the water into. It is positioned over the sea by this module. */
  canvas: HTMLCanvasElement
  /** The particle canvas, mirrored into the water. */
  source: HTMLCanvasElement
  /** The element whose top edge is the horizon (`.home-hero-sea`). */
  sea: HTMLElement
  /** The positioned ancestor both canvases are placed in (the hero section). */
  host: HTMLElement
  /** The shell's box, for the glow under it. */
  anchor: HTMLElement
  /** The moon, if shown, for its glitter path. */
  moon?: HTMLElement | null
}

export interface HeroWaterHandle {
  /** Draws one frame. `flash` (0..1) brightens the shell's glow, as the shell flares. */
  render: (time: number, flash: number) => void
  destroy: () => void
}

/** Tallest strip of water drawn, in CSS pixels; below it the CSS sea fades to the page colour. */
export const WATER_MAX_HEIGHT = 460
/** Render scale relative to CSS pixels (before the device pixel ratio cap). */
const RENDER_SCALE = 0.5
/** Width of the mirrored reflection texture, in pixels. */
const REFLECTION_WIDTH = 384

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

export const WATER_FRAGMENT = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uSize;      // water strip in CSS px
uniform float uTime;
uniform vec3 uShell;     // shell x (css px), glow, flash
uniform vec2 uMoon;      // moon x (css px), strength (0 when hidden)
uniform sampler2D uRefl; // particle strip above the horizon, top row first
uniform float uReflSpan; // its height in css px

// Sine-free hash (Dave Hoskins), cheaper and steadier than fract(sin()) on mobile GPUs.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
// Long swells plus two octaves of chop, in world units (x across, y away from the viewer).
float height(vec2 w, float t, float detail) {
  float h = sin(w.x * 0.55 + w.y * 1.05 + t * 0.9) * 0.42;
  h += sin(w.x * -0.9 + w.y * 1.6 + t * 1.25) * 0.26;
  h += sin(w.x * 1.7 + w.y * 0.45 - t * 1.05) * 0.14 * detail;
  h += (noise(w * 1.6 + vec2(t * 0.22, -t * 0.35)) - 0.5) * 0.55 * detail;
  h += (noise(w * 3.9 + vec2(-t * 0.5, t * 0.3)) - 0.5) * 0.24 * detail;
  return h;
}

void main() {
  float dn = vUv.y * uSize.y;          // css px below the horizon
  float x = vUv.x * uSize.x;
  float persp = dn + 3.0;
  // Perspective: across the screen a pixel spans x / persp, away from it z / persp^2. The ratio
  // keeps near water from stretching into streaks while far water flattens toward the horizon.
  float z = 275.0 / persp;             // distance to this patch of water
  float detail = 1.0 - smoothstep(18.0, 70.0, z); // far water is too small to show chop
  vec2 w = vec2((x - uSize.x * 0.5) * 0.6 / persp, z);
  float t = uTime;

  // Normal by forward differences (three samples); the step widens with distance so far water
  // doesn't alias.
  float e = 0.04 + z * 0.012;
  float h0 = height(w, t, detail);
  float hx = (height(w + vec2(e, 0.0), t, detail) - h0) * 2.0;
  float hz = (height(w + vec2(0.0, e), t, detail) - h0) * 2.0;
  float tilt = 0.55 / (1.0 + z * 0.03);
  vec3 n = normalize(vec3(-hx * tilt / e, 1.0, -hz * tilt / e * 0.6));

  // Grazing near the horizon, steeper toward the viewer: reflection gives way to deep water.
  float grazing = 1.0 - smoothstep(0.0, uSize.y, dn);
  float fresnel = 0.18 + 0.72 * pow(grazing, 2.2) + 0.25 * n.z * grazing;
  vec3 deep = vec3(0.008, 0.026, 0.045);
  vec3 skyLow = vec3(0.045, 0.115, 0.17);
  vec3 skyHigh = vec3(0.02, 0.045, 0.08);
  // Waves facing the viewer reflect higher, darker sky; ones tilted away reflect the bright horizon.
  vec3 sky = mix(skyLow, skyHigh, clamp(0.5 + n.z * 2.5, 0.0, 1.0));
  vec3 col = mix(deep, sky, clamp(fresnel, 0.0, 1.0));

  // Mirror of the particle field: the point as far above the horizon as this one is below,
  // pushed around by the wave normal.
  float amp = 4.0 + dn * 0.22;
  vec2 ruv = vec2((x + n.x * amp * 2.2) / uSize.x, 1.0 - (dn * 1.05 + n.z * amp * 3.0) / uReflSpan);
  if (ruv.y > 0.0 && ruv.y < 1.0) {
    vec3 refl = texture2D(uRefl, ruv).rgb;
    col += refl * (0.62 * fresnel + 0.12) * (1.0 - smoothstep(uReflSpan * 0.55, uReflSpan * 0.95, dn));
  }

  // Glitter: the shell's cyan glow and the moon's path, where a wave faces the light.
  float slope = n.x / n.y;
  float spark = smoothstep(0.3, 0.9, h0 * 0.9 + 0.5 + (noise(w * 6.0 + t) - 0.5) * 0.5);
  float sx = (x - uShell.x) / (60.0 + dn * 1.15) + slope * 1.6;
  float shellPath = exp(-sx * sx * 1.6);
  col += vec3(0.25, 0.75, 0.95) * shellPath * (0.05 + 0.4 * spark) * (0.35 + uShell.z) * uShell.y * exp(-dn / 240.0);
  float mx = (x - uMoon.x) / (10.0 + dn * 0.32) + slope * 2.0;
  float moonPath = exp(-mx * mx * 4.0);
  col += vec3(0.8, 0.88, 0.95) * moonPath * spark * spark * spark * 0.6 * uMoon.y * exp(-dn / 150.0);

  // A thin bright seam at the horizon, then fade out to the CSS sea below.
  col += vec3(0.25, 0.5, 0.6) * exp(-dn * 0.5) * (0.25 + 0.5 * exp(-pow((x - uShell.x) / 420.0, 2.0)));
  float alpha = smoothstep(0.0, 1.5, dn) * (1.0 - smoothstep(uSize.y * 0.62, uSize.y, dn));
  gl_FragColor = vec4(col * alpha, alpha);
}
`

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function startHeroWater(opts: HeroWaterOptions): HeroWaterHandle | null {
  const { canvas, source, sea, host, anchor, moon } = opts
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' })
  if (!gl) return null
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fs = compile(gl, gl.FRAGMENT_SHADER, WATER_FRAGMENT)
  const program = gl.createProgram()
  if (!vs || !fs || !program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)

  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const u = {
    size: gl.getUniformLocation(program, 'uSize'),
    time: gl.getUniformLocation(program, 'uTime'),
    shell: gl.getUniformLocation(program, 'uShell'),
    moon: gl.getUniformLocation(program, 'uMoon'),
    refl: gl.getUniformLocation(program, 'uRefl'),
    span: gl.getUniformLocation(program, 'uReflSpan'),
  }

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  gl.uniform1i(u.refl, 0)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  // The reflection strip is copied here first, so the upload is a few hundred pixels wide.
  const strip = document.createElement('canvas')
  const stripCtx = strip.getContext('2d')

  let width = 0
  let height = 0
  let span = 1
  let horizonInSource = 0
  let sourceScale = 1
  let shellX = 0
  let moonX = 0
  let moonOn = 0
  let lost = false

  function measure() {
    const hostRect = host.getBoundingClientRect()
    const seaRect = sea.getBoundingClientRect()
    const srcRect = source.getBoundingClientRect()
    const anchorRect = anchor.getBoundingClientRect()
    const top = seaRect.top - hostRect.top
    width = Math.max(1, hostRect.width)
    height = Math.max(1, Math.min(WATER_MAX_HEIGHT, hostRect.bottom - seaRect.top))
    canvas.style.top = `${top}px`
    canvas.style.height = `${height}px`
    const scale = Math.min(window.devicePixelRatio || 1, 2) * RENDER_SCALE
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    gl!.viewport(0, 0, canvas.width, canvas.height)
    horizonInSource = seaRect.top - srcRect.top
    sourceScale = source.width / Math.max(1, srcRect.width)
    // Mirror as much sky as there is water, but never past the top of the particle canvas.
    span = Math.max(1, Math.min(height * 1.1, horizonInSource))
    strip.width = REFLECTION_WIDTH
    strip.height = Math.max(8, Math.round((REFLECTION_WIDTH * span) / width))
    shellX = anchorRect.left + anchorRect.width / 2 - hostRect.left
    const moonRect = moon?.getBoundingClientRect()
    moonOn = moonRect && moonRect.width > 0 ? 1 : 0
    moonX = moonRect ? moonRect.left + moonRect.width / 2 - hostRect.left : 0
  }

  const onLost = (event: Event) => {
    event.preventDefault()
    lost = true
    canvas.removeAttribute('data-ready')
    host.setAttribute('data-water', 'css')
  }
  canvas.addEventListener('webglcontextlost', onLost)

  measure()
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => measure()) : null
  resizeObserver?.observe(host)
  resizeObserver?.observe(anchor)
  let ready = false

  return {
    render(time, flash) {
      if (lost || !stripCtx) return
      // Mirror source: the particle strip just above the horizon.
      stripCtx.clearRect(0, 0, strip.width, strip.height)
      const sy = (horizonInSource - span) * sourceScale
      if (sy >= 0 && source.width > 0) {
        stripCtx.drawImage(source, 0, sy, source.width, span * sourceScale, 0, 0, strip.width, strip.height)
      }
      gl!.bindTexture(gl!.TEXTURE_2D, texture)
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, strip)
      gl!.uniform2f(u.size, width, height)
      gl!.uniform1f(u.time, time)
      gl!.uniform3f(u.shell, shellX, 1, Math.min(1, flash))
      gl!.uniform2f(u.moon, moonX, moonOn)
      gl!.uniform1f(u.span, span)
      gl!.clearColor(0, 0, 0, 0)
      gl!.clear(gl!.COLOR_BUFFER_BIT)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
      if (!ready) {
        ready = true
        canvas.setAttribute('data-ready', 'true')
        host.setAttribute('data-water', 'webgl')
      }
    },
    destroy() {
      resizeObserver?.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeAttribute('data-ready')
      host.setAttribute('data-water', 'css')
      gl!.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
