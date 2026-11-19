/**
 * Baked shading. When a character is built, the stage works out once how much of the sky each
 * point on the shell can see past the rest of the body (ambient occlusion), and stores it on the
 * vertex. Creases under the head, between the legs, at the joints and under gear then darken with
 * no cost per frame.
 *
 * The bake runs on the graphics card: for each of a few dozen directions it draws the body's depth
 * as seen from that direction, then checks every vertex against it. One small read back at the end
 * hands the result to the vertices. Arms move a lot against the body, so each arm is baked only
 * against itself and the body only against itself; where an arm and the body meet, the live
 * occluder spheres (flex.ts) still shade them as they move.
 */
import {
  AddEquation,
  BufferAttribute,
  BufferGeometry,
  Color,
  CustomBlending,
  HalfFloatType,
  Matrix4,
  Mesh,
  NearestFilter,
  NoBlending,
  OneFactor,
  OrthographicCamera,
  Points,
  RawShaderMaterial,
  Scene,
  SkinnedMesh,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  type Material,
  type Object3D,
  type WebGLRenderer,
} from 'three'

/** Which part of the body a vertex moves with: 0 the body, 1 the left arm, 2 the right arm. */
export type BakeGroup = 0 | 1 | 2

const ARM = /^(arm|forearm|claw|thumb)([LR])$/

export function groupOfBone(name: string | null | undefined): BakeGroup {
  const m = name ? ARM.exec(name) : null
  return m ? (m[2] === 'L' ? 1 : 2) : 0
}

/** Materials that read the baked shading (the shell family), marked when they are made. */
export function readsBake(material: Material | Material[]): boolean {
  return !Array.isArray(material) && material.userData.bakedAo === true
}

/** The bone a mesh hangs from, for meshes that are not skinned. */
function boneAbove(object: Object3D, bones: Map<string, Object3D>): string | null {
  for (let node: Object3D | null = object; node; node = node.parent) if (bones.get(node.name) === node) return node.name
  return null
}

const skinIndex = new Vector4()
const skinWeight = new Vector4()

/** The bone that moves a skinned vertex most. */
function dominantBone(mesh: SkinnedMesh, i: number): string {
  skinIndex.fromBufferAttribute(mesh.geometry.getAttribute('skinIndex') as BufferAttribute, i)
  skinWeight.fromBufferAttribute(mesh.geometry.getAttribute('skinWeight') as BufferAttribute, i)
  let best = 0
  for (let k = 1; k < 4; k++) if (skinWeight.getComponent(k) > skinWeight.getComponent(best)) best = k
  return mesh.skeleton.bones[skinIndex.getComponent(best)]?.name ?? ''
}

/**
 * Give every mesh that reads the bake its `bake` attribute: x the baked openness (1, fully open,
 * until a bake fills it in) and y the group it moves with. Every such mesh needs it, or the shader
 * would read zero and draw it black.
 */
export function prepareBake(root: Object3D, bones: Map<string, Object3D>): void {
  root.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh || !readsBake(mesh.material)) return
    const count = mesh.geometry.getAttribute('position').count
    const data = new Float32Array(count * 2)
    const skinned = mesh instanceof SkinnedMesh
    const fixed = skinned ? 0 : groupOfBone(boneAbove(mesh, bones))
    for (let i = 0; i < count; i++) {
      data[i * 2] = 1
      data[i * 2 + 1] = skinned ? groupOfBone(dominantBone(mesh, i)) : fixed
    }
    mesh.geometry.setAttribute('bake', new BufferAttribute(data, 2))
  })
}

/** Evenly spread directions over the whole sphere. */
export function sphereDirections(n: number): Vector3[] {
  const out: Vector3[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) / n) * 2
    const r = Math.sqrt(1 - y * y)
    out.push(new Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r))
  }
  return out
}

const DEPTH_VERT = /* glsl */ `
  precision highp float;
  attribute vec3 position;
  uniform mat4 viewProj;
  uniform vec3 dir;
  uniform float far;
  varying float vDepth;
  void main() {
    // Height above the far side of the body along the direction: never below zero, and zero
    // (what the picture is cleared to) means nothing is there.
    vDepth = dot(position, dir) - far;
    gl_Position = viewProj * vec4(position, 1.0);
  }`
const DEPTH_FRAG = /* glsl */ `
  precision highp float;
  varying float vDepth;
  void main() { gl_FragColor = vec4(vDepth, 0.0, 0.0, 1.0); }`

const POINT_VERT = /* glsl */ `
  precision highp float;
  attribute vec3 position;
  attribute vec3 normal;
  attribute float texel;
  uniform vec2 grid;
  uniform mat4 viewProj;
  uniform vec3 dir;
  uniform float bias;
  uniform float far;
  varying float vWeight;
  varying vec2 vAt;
  varying float vDepth;
  void main() {
    vWeight = max(dot(normal, dir), 0.0);
    // Nudged off the surface, so a face does not hide itself.
    vec3 p = position + normal * bias;
    vec4 clip = viewProj * vec4(p, 1.0);
    vAt = clip.xy / clip.w * 0.5 + 0.5;
    vDepth = dot(p, dir) - far;
    float x = mod(texel, grid.x);
    float y = floor(texel / grid.x);
    gl_Position = vec4((vec2(x, y) + 0.5) / grid * 2.0 - 1.0, 0.0, 1.0);
    gl_PointSize = 1.0;
  }`
const POINT_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D depth;
  uniform float bias;
  varying float vWeight;
  varying vec2 vAt;
  varying float vDepth;
  void main() {
    float nearest = texture2D(depth, vAt).r;
    float open = vDepth >= nearest - bias ? 1.0 : 0.0;
    gl_FragColor = vec4(open * vWeight, vWeight, 0.0, 1.0);
  }`

export interface BakeOptions {
  /** How many directions to look from (more is smoother and slower). */
  directions?: number
  /** Size of each depth picture, in pixels. */
  size?: number
  /** Same key, same body in the same pose: the last bakes are kept and reused (stills, rebuilds). */
  key?: string
}

/** Recent bakes, newest last: per mesh that reads the bake, in traversal order. */
const recent = new Map<string, Float32Array[]>()
const RECENT = 12

/** The meshes that read the bake, in a fixed order. */
function receiversOf(root: Object3D): Mesh[] {
  const out: Mesh[] = []
  root.traverse((node) => {
    const mesh = node as Mesh
    if (mesh.isMesh && mesh.visible && readsBake(mesh.material) && mesh.geometry.getAttribute('bake')) out.push(mesh)
  })
  return out
}

function remember(key: string, meshes: Mesh[]): void {
  recent.delete(key)
  recent.set(key, meshes.map((m) => Float32Array.from({ length: m.geometry.getAttribute('bake').count }, (_, i) => m.geometry.getAttribute('bake').getX(i))))
  if (recent.size > RECENT) recent.delete(recent.keys().next().value!)
}

function recall(key: string, meshes: Mesh[]): boolean {
  const saved = recent.get(key)
  if (!saved || saved.length !== meshes.length || saved.some((a, i) => a.length !== meshes[i].geometry.getAttribute('bake').count)) return false
  meshes.forEach((m, i) => {
    const bake = m.geometry.getAttribute('bake') as BufferAttribute
    for (let k = 0; k < bake.count; k++) bake.setX(k, saved[i][k])
    bake.needsUpdate = true
  })
  recent.delete(key)
  recent.set(key, saved)
  return true
}

/** Whether this renderer can draw into and blend half-float targets, which the bake needs. */
export function canBake(renderer: WebGLRenderer): boolean {
  const gl = renderer.getContext()
  if (!renderer.capabilities.isWebGL2) return false
  return Boolean(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))
}

interface Receiver {
  mesh: Mesh
  /** First texel of this mesh's vertices. */
  start: number
}

/**
 * Bake the character's shading in the pose it stands in now. Returns the milliseconds it took, or
 * null if this renderer cannot bake (the shader then leaves the shell fully open).
 */
export function bakeOcclusion(renderer: WebGLRenderer, root: Object3D, bones: Map<string, Object3D>, options: BakeOptions = {}): number | null {
  if (!canBake(renderer)) return null
  const t0 = performance.now()
  if (options.key && recall(options.key, receiversOf(root))) return performance.now() - t0
  root.updateMatrixWorld(true)

  // Every vertex of every mesh, in world space, and the triangles of each group.
  const meshes: Mesh[] = []
  root.traverse((node) => {
    const mesh = node as Mesh
    if (mesh.isMesh && mesh.visible && mesh.geometry.getAttribute('position')) meshes.push(mesh)
  })
  let total = 0
  for (const mesh of meshes) total += mesh.geometry.getAttribute('position').count
  const world = new Float32Array(total * 3)
  const groupOf = new Uint8Array(total)
  const tris: number[][] = [[], [], []]
  const receivers: Receiver[] = []
  const v = new Vector3()
  let base = 0
  let texels = 0
  for (const mesh of meshes) {
    const geo = mesh.geometry
    const pos = geo.getAttribute('position')
    const skinned = mesh instanceof SkinnedMesh
    const fixed = skinned ? 0 : groupOfBone(boneAbove(mesh, bones))
    const bake = geo.getAttribute('bake') as BufferAttribute | undefined
    for (let i = 0; i < pos.count; i++) {
      if (skinned) (mesh as SkinnedMesh).getVertexPosition(i, v)
      else v.fromBufferAttribute(pos, i)
      v.applyMatrix4(mesh.matrixWorld)
      world.set([v.x, v.y, v.z], (base + i) * 3)
      groupOf[base + i] = bake ? bake.getY(i) : skinned ? groupOfBone(dominantBone(mesh as SkinnedMesh, i)) : fixed
    }
    const index = geo.getIndex()
    const triCount = index ? index.count / 3 : pos.count / 3
    for (let t = 0; t < triCount; t++) {
      const a = index ? index.getX(t * 3) : t * 3
      const b = index ? index.getX(t * 3 + 1) : t * 3 + 1
      const c = index ? index.getX(t * 3 + 2) : t * 3 + 2
      tris[groupOf[base + a]].push(base + a, base + b, base + c)
    }
    if (bake && readsBake(mesh.material)) {
      receivers.push({ mesh, start: texels })
      texels += pos.count
    }
    base += pos.count
  }
  if (!texels) return 0

  // World normals of the receivers, skinned ones turned with their bones.
  const grid = { x: 256, y: Math.ceil(texels / 256) }
  const points = [new BufferGeometry(), new BufferGeometry(), new BufferGeometry()]
  {
    const byGroup: { p: number[]; n: number[]; t: number[] }[] = [0, 1, 2].map(() => ({ p: [], n: [], t: [] }))
    const n = new Vector3()
    const m = new Matrix4()
    const sum = new Matrix4()
    const normalMatrix = new Matrix4()
    let at = 0
    for (const r of receivers) {
      const geo = r.mesh.geometry
      const pos = geo.getAttribute('position')
      const nor = geo.getAttribute('normal')
      const bake = geo.getAttribute('bake')
      const offset = meshes.indexOf(r.mesh)
      let first = 0
      for (let k = 0; k < offset; k++) first += meshes[k].geometry.getAttribute('position').count
      normalMatrix.copy(r.mesh.matrixWorld)
      const skinned = r.mesh instanceof SkinnedMesh ? (r.mesh as SkinnedMesh) : null
      for (let i = 0; i < pos.count; i++) {
        n.fromBufferAttribute(nor, i)
        if (skinned) {
          // Blend the bone matrices the way the GPU will, and turn the normal by the blend.
          skinIndex.fromBufferAttribute(geo.getAttribute('skinIndex') as BufferAttribute, i)
          skinWeight.fromBufferAttribute(geo.getAttribute('skinWeight') as BufferAttribute, i)
          sum.makeScale(0, 0, 0)
          for (let k = 0; k < 4; k++) {
            const w = skinWeight.getComponent(k)
            if (!w) continue
            const bone = skinned.skeleton.bones[skinIndex.getComponent(k)]
            m.multiplyMatrices(bone.matrixWorld, skinned.skeleton.boneInverses[skinIndex.getComponent(k)])
            for (let e = 0; e < 16; e++) sum.elements[e] += m.elements[e] * w
          }
          sum.premultiply(skinned.bindMatrixInverse).multiply(skinned.bindMatrix)
          n.transformDirection(sum)
        }
        n.transformDirection(normalMatrix)
        const g = bake.getY(i)
        const w = (first + i) * 3
        byGroup[g].p.push(world[w], world[w + 1], world[w + 2])
        byGroup[g].n.push(n.x, n.y, n.z)
        byGroup[g].t.push(at + i)
      }
      at += pos.count
    }
    byGroup.forEach((b, g) => {
      points[g].setAttribute('position', new BufferAttribute(new Float32Array(b.p), 3))
      points[g].setAttribute('normal', new BufferAttribute(new Float32Array(b.n), 3))
      points[g].setAttribute('texel', new BufferAttribute(new Float32Array(b.t), 1))
    })
  }

  // The body's bounds, so each depth picture just fits it.
  const centre = new Vector3()
  let radius = 0
  {
    const box = { min: new Vector3(Infinity, Infinity, Infinity), max: new Vector3(-Infinity, -Infinity, -Infinity) }
    for (let i = 0; i < total; i++) {
      v.fromArray(world, i * 3)
      box.min.min(v)
      box.max.max(v)
    }
    centre.addVectors(box.min, box.max).multiplyScalar(0.5)
    radius = box.min.distanceTo(box.max) / 2 + 0.01
  }

  const shared = new BufferAttribute(world, 3)
  const occluders = tris.map((list) => {
    const g = new BufferGeometry()
    g.setAttribute('position', shared)
    g.setIndex(list.length > 65535 * 3 || total > 65535 ? new BufferAttribute(new Uint32Array(list), 1) : new BufferAttribute(new Uint16Array(list), 1))
    return g
  })

  const size = options.size ?? 512
  const type = HalfFloatType
  const depthTarget = new WebGLRenderTarget(size, size, { type, minFilter: NearestFilter, magFilter: NearestFilter, depthBuffer: true })
  const sumTarget = new WebGLRenderTarget(grid.x, grid.y, { type, minFilter: NearestFilter, magFilter: NearestFilter, depthBuffer: false })
  const outTarget = new WebGLRenderTarget(grid.x, grid.y, { minFilter: NearestFilter, magFilter: NearestFilter, depthBuffer: false })
  const camera = new OrthographicCamera(-radius, radius, radius, -radius, 0.01, radius * 4)
  const viewProj = new Matrix4()
  const dir = new Vector3()
  const far = { value: 0 }
  const bias = (radius * 2) / size * 1.5
  const depthMaterial = new RawShaderMaterial({ vertexShader: DEPTH_VERT, fragmentShader: DEPTH_FRAG, uniforms: { viewProj: { value: viewProj }, dir: { value: dir }, far }, side: 2, blending: NoBlending })
  const pointMaterial = new RawShaderMaterial({
    vertexShader: POINT_VERT,
    fragmentShader: POINT_FRAG,
    uniforms: { viewProj: { value: viewProj }, dir: { value: dir }, depth: { value: depthTarget.texture }, grid: { value: [grid.x, grid.y] }, bias: { value: bias }, far },
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    depthTest: false,
    depthWrite: false,
  })
  const resolveMaterial = new RawShaderMaterial({
    vertexShader: `precision highp float; attribute vec3 position; varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `precision highp float; uniform sampler2D sums; varying vec2 vUv; void main() { vec2 s = texture2D(sums, vUv).rg; gl_FragColor = vec4(s.y > 0.0 ? s.x / s.y : 1.0, 0.0, 0.0, 1.0); }`,
    uniforms: { sums: { value: sumTarget.texture } },
    depthTest: false,
    depthWrite: false,
  })
  const quad = new BufferGeometry()
  quad.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))

  const depthScene = new Scene()
  const depthMesh = new Mesh(occluders[0], depthMaterial)
  depthMesh.frustumCulled = false
  depthScene.add(depthMesh)
  const pointScene = new Scene()
  const pointCloud = new Points(points[0], pointMaterial)
  pointCloud.frustumCulled = false
  pointScene.add(pointCloud)
  const resolveScene = new Scene()
  const resolveMesh = new Mesh(quad, resolveMaterial)
  resolveMesh.frustumCulled = false
  resolveScene.add(resolveMesh)

  const before = {
    target: renderer.getRenderTarget(),
    autoClear: renderer.autoClear,
    clear: renderer.getClearColor(new Color()),
    alpha: renderer.getClearAlpha(),
    shadows: renderer.shadowMap.autoUpdate,
  }
  renderer.autoClear = false
  renderer.shadowMap.autoUpdate = false
  renderer.setRenderTarget(sumTarget)
  renderer.setClearColor(0x000000, 0)
  renderer.clear(true, false, false)

  const dirs = sphereDirections(options.directions ?? 32)
  for (const d of dirs) {
    dir.copy(d)
    far.value = centre.dot(d) - radius - 0.01
    camera.position.copy(centre).addScaledVector(d, radius * 2)
    camera.up.set(Math.abs(d.y) > 0.9 ? 1 : 0, Math.abs(d.y) > 0.9 ? 0 : 1, 0)
    camera.lookAt(centre)
    camera.updateMatrixWorld(true)
    viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    for (const g of [0, 1, 2] as const) {
      if (!points[g].getAttribute('texel').count) continue
      depthMesh.geometry = occluders[g]
      renderer.setRenderTarget(depthTarget)
      renderer.setClearColor(0x000000, 1)
      renderer.clear(true, true, false)
      renderer.render(depthScene, camera)
      pointCloud.geometry = points[g]
      renderer.setRenderTarget(sumTarget)
      renderer.render(pointScene, camera)
    }
  }
  renderer.setRenderTarget(outTarget)
  renderer.render(resolveScene, camera)
  const pixels = new Uint8Array(grid.x * grid.y * 4)
  renderer.readRenderTargetPixels(outTarget, 0, 0, grid.x, grid.y, pixels)

  for (const r of receivers) {
    const bake = r.mesh.geometry.getAttribute('bake') as BufferAttribute
    for (let i = 0; i < bake.count; i++) bake.setX(i, pixels[(r.start + i) * 4] / 255)
    bake.needsUpdate = true
  }

  if (options.key) remember(options.key, receiversOf(root))

  renderer.setRenderTarget(before.target)
  renderer.autoClear = before.autoClear
  renderer.shadowMap.autoUpdate = before.shadows
  renderer.setClearColor(before.clear, before.alpha)
  for (const g of [...points, ...occluders, quad]) g.dispose()
  for (const m of [depthMaterial, pointMaterial, resolveMaterial]) m.dispose()
  for (const t of [depthTarget, sumTarget, outTarget]) t.dispose()
  return performance.now() - t0
}
