/**
 * The character stage: the painted kit drawn with WebGL 2, lit by a light that follows the
 * pointer (or the phone's tilt), over the member's own backdrop with light shafts, caustics,
 * drifting motes and bubbles.
 *
 * Every painted layer is a flat card. Lighting fakes its relief: a blurred copy of the layer's
 * alpha (a lower mip level) acts as a height map, so each part reads as a soft dome, and the
 * painted shading adds finer detail. The art already carries its own shading, so the light only
 * adds gloss, a rim and a little shading on top.
 *
 * No library, like the homepage water. Falls back (the caller swaps in the SVG avatar) when
 * WebGL 2 is missing, the context is lost, or frames stay slow after dropping resolution.
 */
import type { KitStageScene } from './layers'
import type { RasterScene } from './raster'
import { IDENTITY, StageMotion, apply, multiply, poseMatrix, type Mat2D } from './motion'

export interface KitStageRendererOptions {
  canvas: HTMLCanvasElement
  /** Frames stayed slow even at reduced resolution. */
  onSlow?: () => void
  /** The WebGL context was lost or could not be created. */
  onLost?: () => void
  /** Called once, after the first frame with a scene has been drawn. */
  onFirstFrame?: () => void
  /** Idle phase, so two members' characters don't breathe in step. */
  phase?: number
}

/** The SVG avatar's full-body frame (LOBSTER_FULL_BODY_VIEWBOX). */
const FRAME = { x: -65, y: -35, size: 230 }
/** Ground line, in viewBox units (races.ts GROUND_Y). */
const GROUND_Y = 185
/** Parallax travel per unit of layer depth, in viewBox units at full pointer deflection. */
const PARALLAX = { x: 2.6, y: 1.4 }

const GLOSS_BY_FINISH: Record<string, number> = {
  gloss: 0.6,
  satin: 0.32,
  pearl: 0.7,
  chrome: 1,
  glow: 0.5,
}

// ─── Shaders ─────────────────────────────────────────────────────────────────

const CAUSTIC = `
float caustic(vec2 p, float t) {
  vec2 i = p;
  float c = 0.0;
  for (int k = 0; k < 3; k++) {
    float tk = t * (0.45 + 0.17 * float(k));
    i = p + vec2(cos(tk - i.x) + sin(tk + i.y), sin(tk - i.y) + cos(tk + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tk) / 0.012), p.y / (cos(i.y + tk) / 0.012)));
  }
  c /= 3.0;
  c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.0);
}
`

const QUAD_VERTEX = `#version 300 es
in vec2 aCorner;
uniform mat3 uM;
uniform vec2 uSize;
out vec2 vUv;
out vec2 vPx;
void main() {
  vUv = aCorner;
  vec3 p = uM * vec3(aCorner, 1.0);
  vPx = p.xy;
  gl_Position = vec4(p.x / uSize.x * 2.0 - 1.0, 1.0 - p.y / uSize.y * 2.0, 0.0, 1.0);
}
`

const SPRITE_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vPx;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uLod;
uniform float uRot;
uniform vec3 uLight;      // device px x, y, height
uniform float uGloss;
uniform float uAlpha;
uniform float uFlash;
uniform float uTime;
uniform float uPxPerUnit;
uniform vec3 uRim;
out vec4 outColor;
${CAUSTIC}
float height(vec2 uv) { return textureLod(uTex, uv, uLod).a; }
float luma(vec2 uv) { return dot(textureLod(uTex, uv, 2.0).rgb, vec3(0.299, 0.587, 0.114)); }
void main() {
  vec4 c = texture(uTex, vUv);
  if (c.a < 0.004) discard;
  // Soft dome from the blurred silhouette, finer relief from the painted shading.
  vec2 e = uTexel * exp2(uLod);
  vec2 g = vec2(height(vUv + vec2(e.x, 0.0)) - height(vUv - vec2(e.x, 0.0)),
                height(vUv + vec2(0.0, e.y)) - height(vUv - vec2(0.0, e.y))) * 2.4;
  vec2 f = uTexel * 4.0;
  g += vec2(luma(vUv + vec2(f.x, 0.0)) - luma(vUv - vec2(f.x, 0.0)),
            luma(vUv + vec2(0.0, f.y)) - luma(vUv - vec2(0.0, f.y))) * 0.25;
  float cs = cos(uRot);
  float sn = sin(uRot);
  g = vec2(cs * g.x - sn * g.y, sn * g.x + cs * g.y);
  vec3 n = normalize(vec3(-g, 1.0));

  vec3 L = normalize(vec3(uLight.xy - vPx, uLight.z));
  float diff = max(dot(n, L), 0.0);
  float nh = max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0);
  // A tight highlight: flat paint facing the lamp would otherwise bloom into a white patch.
  float spec = pow(nh, 110.0) * uGloss;
  float sheen = pow(nh, 12.0) * uGloss * 0.05;

  // Cool rim from behind, upper right, only near the silhouette.
  float edge = 1.0 - smoothstep(0.15, 0.6, textureLod(uTex, vUv, max(uLod - 1.0, 0.0)).a);
  float rim = edge * max(dot(normalize(n.xy + 1e-4), normalize(vec2(0.6, -0.8))), 0.0);

  float caus = caustic(vPx / uPxPerUnit * 0.16, uTime);
  // Additive light is scaled by the paint's own brightness, so dark details (pupils, mouths,
  // outlines) stay dark instead of washing grey.
  float paint = smoothstep(0.08, 0.45, dot(c.rgb / max(c.a, 1e-3), vec3(0.299, 0.587, 0.114)));
  vec3 lit = c.rgb * (0.8 + 0.24 * diff)
    + c.a * paint * (vec3(1.0, 0.98, 0.94) * (spec * 0.32 + sheen)
           + uRim * rim * 0.35
           + vec3(0.55, 0.85, 1.0) * caus * 0.035 * diff
           + vec3(0.9, 0.97, 1.0) * uFlash * 0.6);
  outColor = vec4(lit, c.a) * uAlpha;
}
`

const BACKDROP_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vPx;
uniform sampler2D uBg;
uniform float uHasBg;
uniform vec4 uBgRect;     // viewBox x, y, w, h
uniform vec3 uView;       // device px per unit, offset x, offset y
uniform vec2 uSize;
uniform vec3 uLight;
uniform float uTime;
uniform float uLean;
uniform vec3 uShadow;     // centre x, y (units), width scale
out vec4 outColor;
${CAUSTIC}
void main() {
  vec2 w = (vPx - uView.yz) / uView.x;
  vec3 col = uHasBg > 0.5 ? texture(uBg, (w - uBgRect.xy) / uBgRect.zw).rgb : vec3(0.02, 0.06, 0.09);

  // Light shafts from the surface, slanting with the lean, fading with depth.
  float depth = clamp((w.y + 35.0) / 230.0, 0.0, 1.0);
  float sx = w.x + (w.y + 35.0) * (0.3 + uLean * 0.12);
  float rays = pow(0.5 + 0.5 * sin(sx * 0.09 + uTime * 0.25), 6.0)
    + pow(0.5 + 0.5 * sin(sx * 0.155 - uTime * 0.18 + 1.7), 9.0) * 0.7
    + pow(0.5 + 0.5 * sin(sx * 0.041 + uTime * 0.11 + 0.6), 4.0) * 0.6;
  col += vec3(0.55, 0.85, 1.0) * rays * (1.0 - depth) * (1.0 - depth) * 0.15;

  // A soft pool of light where the lamp is.
  float d = length((vPx - uLight.xy) / uLight.z);
  col += vec3(0.35, 0.7, 0.95) * 0.09 * exp(-d * d * 2.2);

  // Caustics dancing on the floor.
  col += vec3(0.5, 0.85, 1.0) * caustic(w * 0.12, uTime) * 0.09 * smoothstep(140.0, 195.0, w.y);

  // Contact shadow under the feet.
  vec2 s = (w - uShadow.xy) / vec2(44.0 * uShadow.z, 6.5);
  col *= 1.0 - 0.42 * exp(-dot(s, s) * 1.6);

  vec2 q = vPx / uSize - 0.5;
  col *= 1.0 - 0.6 * dot(q, q);
  outColor = vec4(col, 1.0);
}
`

const PARTICLE_VERTEX = `#version 300 es
in vec2 aPos;
in float aSize;
in vec4 aColor;
in float aKind;
uniform vec2 uSize;
out vec4 vColor;
out float vKind;
void main() {
  vColor = aColor;
  vKind = aKind;
  gl_PointSize = aSize;
  gl_Position = vec4(aPos.x / uSize.x * 2.0 - 1.0, 1.0 - aPos.y / uSize.y * 2.0, 0.0, 1.0);
}
`

const PARTICLE_FRAGMENT = `#version 300 es
precision mediump float;
in vec4 vColor;
in float vKind;
out vec4 outColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d) * 2.0;
  if (r > 1.0) discard;
  float a;
  if (vKind > 0.5) {
    // Bubble: a thin ring with a bright fleck.
    a = smoothstep(0.62, 0.86, r) * (1.0 - smoothstep(0.88, 1.0, r)) * 0.8;
    a += (1.0 - smoothstep(0.0, 0.22, length(d + vec2(0.18, 0.18)))) * 0.9;
  } else {
    a = (1.0 - r) * (1.0 - r);
  }
  outColor = vColor * a;
}
`

// ─── GL helpers ──────────────────────────────────────────────────────────────

function compile(gl: WebGL2RenderingContext, vertex: string, fragment: string, attributes: string[] = []): WebGLProgram {
  const program = gl.createProgram()!
  attributes.forEach((name, i) => gl.bindAttribLocation(program, i, name))
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const) {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
      throw new Error(`kit stage shader: ${gl.getShaderInfoLog(shader)}`)
    }
    gl.attachShader(program, shader)
  }
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    throw new Error(`kit stage program: ${gl.getProgramInfoLog(program)}`)
  }
  return program
}

function uniforms(gl: WebGL2RenderingContext, program: WebGLProgram, names: string[]) {
  return Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(program, n)])) as Record<
    string,
    WebGLUniformLocation | null
  >
}

function texture(gl: WebGL2RenderingContext, source: HTMLCanvasElement, mipmaps: boolean): WebGLTexture {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR)
  if (mipmaps) gl.generateMipmap(gl.TEXTURE_2D)
  return tex
}

function toMat3(m: Mat2D): Float32Array {
  return new Float32Array([m[0], m[1], 0, m[2], m[3], 0, m[4], m[5], 1])
}

// ─── Particles ───────────────────────────────────────────────────────────────

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  kind: 0 | 1
  color: [number, number, number]
  seed: number
  /** Burst sparks fall off with time; ambient ones loop forever. */
  burst: boolean
}

const MAX_PARTICLES = 160
const FLOATS_PER_PARTICLE = 8

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function ambientParticle(kind: 0 | 1, anywhere: boolean): Particle {
  const bubble = kind === 1
  return {
    x: rand(-80, 180),
    y: anywhere ? rand(-50, 205) : 205,
    vx: rand(-1.2, 1.2),
    vy: bubble ? rand(-14, -6) : rand(-2.2, -0.4),
    size: bubble ? rand(1.1, 2.6) : rand(0.5, 1.3),
    life: 0,
    maxLife: Infinity,
    kind,
    color: bubble ? [0.75, 0.92, 1] : [0.45, 0.82, 1],
    seed: Math.random() * 100,
    burst: false,
  }
}

// ─── Renderer ────────────────────────────────────────────────────────────────

interface StageLayer {
  node: number
  tex: WebGLTexture
  texel: [number, number]
  lod: number
  rect: [number, number, number, number]
  hrefs: string[]
  flash: number
}

interface StageScene {
  layers: StageLayer[]
  nodes: KitStageScene['nodes']
  pivots: [number, number][]
  bg: { tex: WebGLTexture; rect: [number, number, number, number] } | null
  gloss: number
}

export class KitStageRenderer {
  private gl: WebGL2RenderingContext
  private sprite: { program: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }
  private backdrop: { program: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }
  private particles: { program: WebGLProgram; u: Record<string, WebGLUniformLocation | null>; vao: WebGLVertexArrayObject; buffer: WebGLBuffer }
  private quadVao: WebGLVertexArrayObject
  private scene: StageScene | null = null
  private motion: StageMotion
  private pointer = { x: 0, y: 0 }
  private pointerTarget = { x: 0, y: 0 }
  private pointerActiveAt = -Infinity
  private particleList: Particle[] = []
  private particleData = new Float32Array(MAX_PARTICLES * FLOATS_PER_PARTICLE)
  private width = 1
  private height = 1
  private renderScale = 1
  private cssWidth = 1
  private cssHeight = 1
  private dpr = 1
  private raf = 0
  private running = false
  private startedAt = performance.now()
  private lastFrame = 0
  private frames = 0
  private slowFrames = 0
  private avgDt = 1 / 60
  private firstFrameSent = false
  private destroyed = false

  constructor(private options: KitStageRendererOptions) {
    const gl = options.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: 'low-power',
    })
    if (!gl) throw new Error('webgl2 unavailable')
    this.gl = gl
    options.canvas.addEventListener('webglcontextlost', this.handleLost)

    // Both quad programs read the shared unit quad at attribute 0.
    const sp = compile(gl, QUAD_VERTEX, SPRITE_FRAGMENT, ['aCorner'])
    this.sprite = {
      program: sp,
      u: uniforms(gl, sp, ['uM', 'uSize', 'uTex', 'uTexel', 'uLod', 'uRot', 'uLight', 'uGloss', 'uAlpha', 'uFlash', 'uTime', 'uPxPerUnit', 'uRim']),
    }
    const bp = compile(gl, QUAD_VERTEX, BACKDROP_FRAGMENT, ['aCorner'])
    this.backdrop = {
      program: bp,
      u: uniforms(gl, bp, ['uM', 'uSize', 'uBg', 'uHasBg', 'uBgRect', 'uView', 'uLight', 'uTime', 'uLean', 'uShadow']),
    }
    const pp = compile(gl, PARTICLE_VERTEX, PARTICLE_FRAGMENT)

    this.quadVao = gl.createVertexArray()!
    gl.bindVertexArray(this.quadVao)
    const quad = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    const buffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.particleData.byteLength, gl.DYNAMIC_DRAW)
    const stride = FLOATS_PER_PARTICLE * 4
    const attr = (name: string, size: number, offset: number) => {
      const loc = gl.getAttribLocation(pp, name)
      if (loc < 0) return
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset * 4)
    }
    attr('aPos', 2, 0)
    attr('aSize', 1, 2)
    attr('aColor', 4, 3)
    attr('aKind', 1, 7)
    gl.bindVertexArray(null)
    this.particles = { program: pp, u: uniforms(gl, pp, ['uSize']), vao, buffer }

    this.motion = new StageMotion(options.phase ?? 0)
    for (let i = 0; i < 14; i++) this.particleList.push(ambientParticle(1, true))
    for (let i = 0; i < 34; i++) this.particleList.push(ambientParticle(0, true))
  }

  /** Canvas size in CSS pixels and the device pixel ratio to render at (already capped). */
  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    this.cssWidth = Math.max(1, cssWidth)
    this.cssHeight = Math.max(1, cssHeight)
    this.dpr = dpr
    this.applySize()
  }

  private applySize(): void {
    const scale = this.dpr * this.renderScale
    this.width = Math.max(1, Math.round(this.cssWidth * scale))
    this.height = Math.max(1, Math.round(this.cssHeight * scale))
    this.options.canvas.width = this.width
    this.options.canvas.height = this.height
  }

  /** Pointer in -1..1 over the stage; null when it leaves. */
  setPointer(x: number | null, y: number | null): void {
    if (x === null || y === null) {
      this.pointerTarget = { x: 0, y: 0 }
      return
    }
    this.pointerTarget = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) }
    this.pointerActiveAt = performance.now()
  }

  /**
   * Swaps in a new set of layers. `equipped` names worn-item hrefs that are new since the last
   * scene; their layers flash and throw sparks, and the character hops.
   */
  setScene(scene: KitStageScene, raster: RasterScene, equipped: Set<string> = new Set()): void {
    const gl = this.gl
    const old = this.scene
    const layers: StageLayer[] = raster.layers.map((l) => {
      // Blur radius for the relief: about 3 viewBox units, whatever the texture resolution.
      const pxPerUnit = l.canvas.width / l.rect[2]
      return {
        node: l.run.node,
        tex: texture(gl, l.canvas, true),
        texel: [1 / l.canvas.width, 1 / l.canvas.height],
        lod: Math.max(1, Math.min(5, Math.log2(pxPerUnit * 3))),
        rect: l.rect,
        hrefs: l.run.hrefs,
        flash: 0,
      }
    })

    // Pivots: the inline pivot when compose gave one, else the CSS fill-box origin of the
    // node's painted bounds (its own layers and its children's).
    const bounds = scene.nodes.map(() => [Infinity, Infinity, -Infinity, -Infinity])
    for (const layer of layers) {
      for (let n = layer.node; n >= 0; n = scene.nodes[n].parent) {
        const b = bounds[n]
        b[0] = Math.min(b[0], layer.rect[0])
        b[1] = Math.min(b[1], layer.rect[1])
        b[2] = Math.max(b[2], layer.rect[0] + layer.rect[2])
        b[3] = Math.max(b[3], layer.rect[1] + layer.rect[3])
      }
    }
    const pivots = scene.nodes.map((node, i): [number, number] => {
      if (node.pivot) return node.pivot
      const b = bounds[i]
      if (!Number.isFinite(b[0])) return [50, GROUND_Y]
      return [b[0] + (b[2] - b[0]) * node.origin[0], b[1] + (b[3] - b[1]) * node.origin[1]]
    })

    this.scene = {
      layers,
      nodes: scene.nodes,
      pivots,
      bg: raster.backdrop ? { tex: texture(gl, raster.backdrop.canvas, false), rect: raster.backdrop.rect } : old?.bg ?? null,
      gloss: GLOSS_BY_FINISH[scene.finish] ?? 0.55,
    }
    if (old) {
      for (const l of old.layers) gl.deleteTexture(l.tex)
      if (old.bg && old.bg !== this.scene.bg) gl.deleteTexture(old.bg.tex)
    }

    if (equipped.size) {
      const worlds = this.nodeWorlds()
      let hit = false
      for (const layer of layers) {
        if (!layer.hrefs.some((h) => equipped.has(h))) continue
        hit = true
        layer.flash = 1
        const [x, y, w, h] = layer.rect
        const [cx, cy] = apply(worlds[layer.node], x + w / 2, y + h / 2)
        this.burst(cx, cy, Math.max(w, h) / 2)
      }
      if (hit) this.motion.kick()
    }
  }

  private burst(x: number, y: number, radius: number): void {
    const palette: [number, number, number][] = [
      [0.49, 0.83, 0.99],
      [0.85, 0.96, 1],
      [0.99, 0.84, 0.45],
    ]
    for (let i = 0; i < 28; i++) {
      const a = rand(0, Math.PI * 2)
      const speed = rand(18, 52)
      const r = rand(0.2, 0.7) * radius
      this.particleList.push({
        x: x + Math.cos(a) * r,
        y: y + Math.sin(a) * r,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 12,
        size: rand(0.7, 1.7),
        life: 0,
        maxLife: rand(0.6, 1.1),
        kind: 0,
        color: palette[i % palette.length],
        seed: Math.random() * 100,
        burst: true,
      })
    }
    if (this.particleList.length > MAX_PARTICLES) this.particleList.splice(48, this.particleList.length - MAX_PARTICLES)
  }

  start(): void {
    if (this.running || this.destroyed) return
    this.running = true
    this.lastFrame = 0
    this.raf = requestAnimationFrame(this.frame)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  destroy(): void {
    this.stop()
    this.destroyed = true
    this.options.canvas.removeEventListener('webglcontextlost', this.handleLost)
    const gl = this.gl
    if (this.scene) {
      for (const l of this.scene.layers) gl.deleteTexture(l.tex)
      if (this.scene.bg) gl.deleteTexture(this.scene.bg.tex)
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }

  private handleLost = (event: Event) => {
    event.preventDefault()
    this.stop()
    this.options.onLost?.()
  }

  /** Device px per viewBox unit, and where the frame's origin lands, fitting the frame (meet). */
  private view(): { scale: number; ox: number; oy: number } {
    const scale = Math.min(this.width, this.height) / FRAME.size
    return {
      scale,
      ox: this.width / 2 - (FRAME.x + FRAME.size / 2) * scale,
      oy: this.height / 2 - (FRAME.y + FRAME.size / 2) * scale,
    }
  }

  private nodeWorlds(): Mat2D[] {
    const scene = this.scene
    if (!scene) return []
    const p = this.pointer
    const worlds: Mat2D[] = []
    scene.nodes.forEach((node, i) => {
      const pose = this.motion.pose(node.anim)
      const parentDepth = node.parent >= 0 ? scene.nodes[node.parent].depth : 0
      pose.dx += p.x * (node.depth - parentDepth) * PARALLAX.x
      pose.dy += p.y * (node.depth - parentDepth) * PARALLAX.y
      const local = poseMatrix(pose, scene.pivots[i])
      worlds.push(node.parent >= 0 ? multiply(worlds[node.parent], local) : local)
    })
    return worlds
  }

  private frame = (now: number) => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.frame)
    const dt = this.lastFrame ? Math.min(0.1, (now - this.lastFrame) / 1000) : 1 / 60
    this.lastFrame = now
    this.watchSpeed(dt)
    this.draw(now, dt)
  }

  /** Halves resolution once if frames run slow, then gives up and lets the caller fall back. */
  private watchSpeed(dt: number): void {
    this.frames++
    if (this.frames < 40) return
    this.avgDt = this.avgDt * 0.95 + dt * 0.05
    this.slowFrames = this.avgDt > 1 / 28 ? this.slowFrames + 1 : 0
    if (this.slowFrames < 90) return
    this.slowFrames = 0
    this.avgDt = 1 / 60
    if (this.renderScale > 0.6) {
      this.renderScale = 0.6
      this.applySize()
    } else {
      this.stop()
      this.options.onSlow?.()
    }
  }

  private draw(now: number, dt: number): void {
    const gl = this.gl
    const scene = this.scene
    if (!scene || gl.isContextLost()) return
    const seconds = (now - this.startedAt) / 1000

    // With no pointer for a while, the light drifts on its own in a slow loop.
    const idle = now - this.pointerActiveAt > 2500
    const target = idle
      ? { x: Math.sin(seconds * 0.23) * 0.45, y: -0.35 + Math.cos(seconds * 0.31) * 0.2 }
      : this.pointerTarget
    const ease = 1 - Math.exp(-dt * (idle ? 1.5 : 7))
    this.pointer = {
      x: this.pointer.x + (target.x - this.pointer.x) * ease,
      y: this.pointer.y + (target.y - this.pointer.y) * ease,
    }
    this.motion.step(seconds, this.pointer)

    const view = this.view()
    const viewMat: Mat2D = [view.scale, 0, 0, view.scale, view.ox, view.oy]
    const size = [this.width, this.height] as const
    const light: [number, number, number] = [
      this.width / 2 + this.pointer.x * this.width * 0.42,
      this.height * 0.3 + this.pointer.y * this.height * 0.38,
      Math.min(this.width, this.height) * 0.55,
    ]
    const worlds = this.nodeWorlds()

    gl.viewport(0, 0, this.width, this.height)
    gl.disable(gl.DEPTH_TEST)
    gl.bindVertexArray(this.quadVao)

    // Backdrop.
    const b = this.backdrop
    gl.disable(gl.BLEND)
    gl.useProgram(b.program)
    gl.uniformMatrix3fv(b.u.uM, false, toMat3([this.width, 0, 0, this.height, 0, 0]))
    gl.uniform2f(b.u.uSize, size[0], size[1])
    gl.uniform3f(b.u.uView, view.scale, view.ox, view.oy)
    gl.uniform3f(b.u.uLight, light[0], light[1], light[2])
    gl.uniform1f(b.u.uTime, seconds)
    gl.uniform1f(b.u.uLean, this.pointer.x)
    const rootPose = this.motion.pose('root')
    const [shadowX] = apply(worlds[0] ?? IDENTITY, 50, GROUND_Y)
    gl.uniform3f(b.u.uShadow, shadowX, GROUND_Y + 1.5, 1 - Math.max(0, -rootPose.dy) * 0.04)
    gl.uniform1f(b.u.uHasBg, scene.bg ? 1 : 0)
    if (scene.bg) {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, scene.bg.tex)
      gl.uniform1i(b.u.uBg, 0)
      gl.uniform4f(b.u.uBgRect, ...scene.bg.rect)
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    // Motes behind the character, bubbles in front.
    this.stepParticles(dt, seconds)
    this.drawParticles(view, (p) => p.kind === 0 && !p.burst)

    // Character, back to front.
    const s = this.sprite
    gl.bindVertexArray(this.quadVao)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(s.program)
    gl.uniform2f(s.u.uSize, size[0], size[1])
    gl.uniform3f(s.u.uLight, light[0], light[1], light[2])
    gl.uniform1f(s.u.uGloss, scene.gloss)
    gl.uniform1f(s.u.uTime, seconds)
    gl.uniform1f(s.u.uPxPerUnit, view.scale)
    gl.uniform3f(s.u.uRim, 0.49, 0.83, 0.99)
    gl.uniform1i(s.u.uTex, 0)
    gl.activeTexture(gl.TEXTURE0)
    for (const layer of scene.layers) {
      const world = worlds[layer.node]
      let alpha = 1
      for (let n = layer.node; n >= 0; n = scene.nodes[n].parent) alpha *= this.motion.pose(scene.nodes[n].anim).alpha
      if (alpha <= 0.001) continue
      const [x, y, w, h] = layer.rect
      const m = multiply(viewMat, multiply(world, [w, 0, 0, h, x, y]))
      layer.flash = Math.max(0, layer.flash - dt * 1.6)
      gl.bindTexture(gl.TEXTURE_2D, layer.tex)
      gl.uniformMatrix3fv(s.u.uM, false, toMat3(m))
      gl.uniform2f(s.u.uTexel, layer.texel[0], layer.texel[1])
      gl.uniform1f(s.u.uLod, layer.lod)
      gl.uniform1f(s.u.uRot, Math.atan2(world[1], world[0]))
      gl.uniform1f(s.u.uAlpha, alpha)
      gl.uniform1f(s.u.uFlash, layer.flash * layer.flash)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    gl.blendFunc(gl.ONE, gl.ONE)
    this.drawParticles(view, (p) => p.kind === 1 || p.burst)

    if (!this.firstFrameSent) {
      this.firstFrameSent = true
      this.options.onFirstFrame?.()
    }
  }

  private stepParticles(dt: number, seconds: number): void {
    const list = this.particleList
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i]
      p.life += dt
      if (p.burst) {
        p.vx *= 1 - dt * 2.2
        p.vy = p.vy * (1 - dt * 2.2) - dt * 6
        if (p.life >= p.maxLife) {
          list.splice(i, 1)
          continue
        }
      } else {
        p.vx += Math.sin(seconds * 0.9 + p.seed) * dt * (p.kind === 1 ? 6 : 1.5)
        p.vx *= 1 - dt * 0.8
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (!p.burst && (p.y < -55 || p.x < -90 || p.x > 190)) list[i] = ambientParticle(p.kind, false)
    }
  }

  private drawParticles(view: { scale: number; ox: number; oy: number }, include: (p: Particle) => boolean): void {
    const gl = this.gl
    const data = this.particleData
    let count = 0
    for (const p of this.particleList) {
      if (!include(p) || count >= MAX_PARTICLES) continue
      const o = count * FLOATS_PER_PARTICLE
      let a: number
      if (p.burst) a = 1 - p.life / p.maxLife
      else if (p.kind === 1) a = 0.28 * Math.min(1, (205 - p.y) / 40)
      else a = 0.22 + 0.18 * Math.sin(p.life * 1.7 + p.seed)
      const size = p.size * view.scale * (p.burst ? 2.4 : 1.6)
      data[o] = p.x * view.scale + view.ox
      data[o + 1] = p.y * view.scale + view.oy
      data[o + 2] = Math.max(1, size)
      data[o + 3] = p.color[0] * a
      data[o + 4] = p.color[1] * a
      data[o + 5] = p.color[2] * a
      data[o + 6] = a
      data[o + 7] = p.kind
      count++
    }
    if (!count) return
    gl.useProgram(this.particles.program)
    gl.uniform2f(this.particles.u.uSize, this.width, this.height)
    gl.bindVertexArray(this.particles.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particles.buffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, count * FLOATS_PER_PARTICLE)
    gl.drawArrays(gl.POINTS, 0, count)
    gl.bindVertexArray(this.quadVao)
  }
}
