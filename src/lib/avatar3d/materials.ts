/**
 * Materials. One physically based shell material carries the palette, finish and marking; the
 * marking is painted in the shader from each vertex's rest position, so patterns stay glued to
 * the shell in any pose. Most markings are drawn in code; a few, and the shell's fine surface,
 * come from small greyscale textures (textures.ts) sampled the same way.
 */
import { BufferAttribute, Color, ShaderChunk, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, type Material, type Object3D, type Texture, Vector2, Vector3, Vector4 } from 'three'
import { OCCLUDERS } from './flex'
import type { ShellFinish, ShellMarking, ShellPalette } from '../avatar/traits'
import { SHELL_PALETTE_MAP } from '../avatar/traits'
import { EYE_COLOR_SWATCH, type AvatarEyeColor } from '../avatar/parts'
import type { MaterialSlot } from './rig'
import { detailOnUniform, detailSlopeUniform, detailUniform, engravingMask, FLAT_DETAIL, gearTile, isTextureMarking, markingMask, NO_MARK, shellDetail, slopeOn, type GearSurface } from './textures'

const MARKING_INDEX: Record<ShellMarking, number> = {
  none: 0,
  spots: 1,
  freckles: 2,
  bands: 3,
  tiger: 4,
  stardust: 5,
  calico: 6,
  split: 7,
  circuit: 8,
  // Drawn from an image mask (uMarkMap).
  lace: 9,
  tide: 9,
  camo: 9,
}

export const NOISE_GLSL = /* glsl */ `
  float a3Hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float a3Noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(a3Hash(i), a3Hash(i + vec3(1, 0, 0)), f.x), mix(a3Hash(i + vec3(0, 1, 0)), a3Hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(a3Hash(i + vec3(0, 0, 1)), a3Hash(i + vec3(1, 0, 1)), f.x), mix(a3Hash(i + vec3(0, 1, 1)), a3Hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  // Distance to the nearest scattered point, and that point's random id in .y.
  vec2 a3Cells(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    float best = 8.0;
    float id = 0.0;
    for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
      vec3 g = vec3(float(x), float(y), float(z));
      float h = a3Hash(i + g);
      vec3 o = g + vec3(h, fract(h * 37.0), fract(h * 91.0)) - f;
      float d = dot(o, o);
      if (d < best) { best = d; id = h; }
    }
    return vec2(sqrt(best), id);
  }
  // How close this point is to the border between its two nearest scattered points (0 on the border).
  float a3CellEdge(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    float best = 8.0;
    float next = 8.0;
    for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
      vec3 g = vec3(float(x), float(y), float(z));
      float h = a3Hash(i + g);
      vec3 o = g + vec3(h, fract(h * 37.0), fract(h * 91.0)) - f;
      float d = dot(o, o);
      if (d < best) { next = best; best = d; } else if (d < next) { next = d; }
    }
    return sqrt(next) - sqrt(best);
  }
  float a3Marking(int kind, vec3 p) {
    if (kind == 1) { vec2 c = a3Cells(p * 6.5); return smoothstep(0.34, 0.26, c.x) * step(0.35, c.y); }
    if (kind == 2) { vec2 c = a3Cells(p * 24.0); return smoothstep(0.26, 0.16, c.x) * step(0.45, c.y) * smoothstep(0.35, 0.6, a3Noise(p * 3.0 + 4.0)); }
    if (kind == 3) { return smoothstep(0.55, 0.75, sin(p.y * 21.0 + a3Noise(p * 5.0) * 1.2) * 0.5 + 0.5); }
    if (kind == 4) {
      float w = sin(p.y * 30.0 + abs(p.x) * 16.0 + a3Noise(p * 6.0) * 3.0) * 0.5 + 0.5;
      return smoothstep(0.6, 0.78, w) * smoothstep(0.02, 0.14, abs(p.x));
    }
    if (kind == 5) { vec2 c = a3Cells(p * 34.0); return smoothstep(0.16, 0.06, c.x) * step(0.62, c.y); }
    if (kind == 6) { return smoothstep(0.52, 0.58, a3Noise(p * 3.4 + 9.0)); }
    if (kind == 8) {
      // Branching traces: the seams between scattered cells, bent a little so they wander.
      float e = a3CellEdge(p * 4.6 + (a3Noise(p * 7.0) - 0.5) * 0.5);
      return smoothstep(0.05, 0.02, e);
    }
    return 0.0;
  }
`

/** Sampling a tiling texture from a 3D point: one look along each axis, blended by which way the surface faces. */
const TRIPLANAR_GLSL = /* glsl */ `
  vec3 a3TriWeights(vec3 n) {
    vec3 w = pow(abs(n), vec3(6.0));
    return w / max(w.x + w.y + w.z, 1e-5);
  }
  // A packed height tile (textures.ts: R height, G and B its slope) sampled triplanar at p, given
  // in tiles. Returns the height and, in .yzw, its slope along p per tile. \`sloped\` is 0 for a
  // plain placeholder, whose G and B are not slopes.
  vec4 a3TriTile(sampler2D map, vec3 p, vec3 w, vec3 o, float sloped) {
    vec3 tx = texture2D(map, p.yz + o.x).rgb;
    vec3 ty = texture2D(map, p.xz + o.y).rgb;
    vec3 tz = texture2D(map, p.xy + o.z).rgb;
    vec2 kx = tx.gb * sloped;
    vec2 ky = ty.gb * sloped;
    vec2 kz = tz.gb * sloped;
    return vec4(tx.r * w.x + ty.r * w.y + tz.r * w.z, vec3(0.0, kx) * w.x + vec3(ky.x, 0.0, ky.y) * w.y + vec3(kz, 0.0) * w.z);
  }
`

/**
 * Specular anti-aliasing: where the bumped normal turns a lot within one pixel, widen the
 * highlight to cover it, so fine bumps read as a soft sheen instead of glitter that crawls as
 * the character moves (Kaplanyan and Hoffman's filtered roughness).
 */
const SPECULAR_AA_GLSL = /* glsl */ `
  {
    vec3 a3dN = fwidth(normal - nonPerturbedNormal);
    roughnessFactor = sqrt(min(roughnessFactor * roughnessFactor + min(2.0 * dot(a3dN, a3dN), 0.18), 1.0));
  }
`

/** Gear's look by material. Each has its own height tile; the code-drawn surface stands in until it loads. */
const GEAR_SURFACE_LOOK: Record<GearSurface, { freq: number; bump: number; pits: number; rough: number }> = {
  // freq: tiles per unit of the piece's own size; bump: how strongly the tile catches light.
  metal: { freq: 3, bump: 0.006, pits: 0.1, rough: 0.25 },
  cloth: { freq: 5, bump: 0.008, pits: 0.18, rough: 0.1 },
  leather: { freq: 3.5, bump: 0.006, pits: 0.14, rough: 0.15 },
  coral: { freq: 2.5, bump: 0.009, pits: 0.22, rough: 0.2 },
  bone: { freq: 2, bump: 0.003, pits: 0.06, rough: 0.12 },
}

export interface WorkedOptions {
  /** Trim colour for the engraving rare and better gear carries (left out: none). */
  engrave?: string
}

/**
 * Give a gear material a worked surface from its material's height tile (textures.ts), sampled
 * triplanar from each point's own position so it stays put as the piece moves. Until the tile has
 * loaded (or if it never does) the surface is drawn in code: `metal` brushed, `cloth` woven, the rest
 * plain. Rare and better gear can add an engraving inlaid in its trim colour.
 */
export function workedSurface<T extends MeshPhysicalMaterial>(material: T, kind: GearSurface, options: WorkedOptions = {}): T {
  const look = GEAR_SURFACE_LOOK[kind]
  const uniforms = {
    uWorkMap: { value: FLAT_DETAIL as Texture },
    uWorkOn: { value: 0 },
    uWorkSloped: { value: 0 },
    uEngraveMap: { value: NO_MARK as Texture },
    uEngraveOn: { value: 0 },
    uEngraveSloped: { value: 0 },
    uEngrave: { value: new Color(options.engrave ?? '#000000') },
  }
  const tile = gearTile(kind, (t) => {
    uniforms.uWorkMap.value = t
    uniforms.uWorkSloped.value = slopeOn(t)
    uniforms.uWorkOn.value = 1
  })
  if (tile !== FLAT_DETAIL) {
    uniforms.uWorkMap.value = tile
    uniforms.uWorkSloped.value = slopeOn(tile)
    uniforms.uWorkOn.value = 1
  }
  if (options.engrave) {
    const mask = engravingMask((t) => {
      uniforms.uEngraveMap.value = t
      uniforms.uEngraveSloped.value = slopeOn(t)
      uniforms.uEngraveOn.value = 1
    })
    if (mask !== NO_MARK) {
      uniforms.uEngraveMap.value = mask
      uniforms.uEngraveSloped.value = slopeOn(mask)
      uniforms.uEngraveOn.value = 1
    }
  }
  material.userData.workUniforms = uniforms
  const coded =
    kind === 'metal'
      ? `
        // Brushed along the piece, with soft patches where the tone shifts like worked metal.
        a3Work = a3Noise(vec3(vWorkRaw.x * 14.0, vWorkRaw.y * 260.0, vWorkRaw.z * 14.0)) * 0.7 + a3Noise(vWorkRaw * 420.0) * 0.3;
        diffuseColor.rgb *= 0.93 + 0.14 * a3Noise(vWorkRaw * 11.0 + 2.0) + 0.05 * (a3Work - 0.5);`
      : kind === 'cloth'
        ? `
        // Over and under threads.
        vec3 a3Thread = vWorkRaw * 380.0;
        a3Work = (sin(a3Thread.x + a3Thread.z) * sin(a3Thread.y)) * 0.5 + 0.5;
        diffuseColor.rgb *= 0.88 + 0.2 * a3Work;`
        : ''
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 workPos;\nvarying vec3 vWork;\nvarying vec3 vWorkRaw;')
      .replace(
        '#include <begin_vertex>',
        // The tile is sized to the piece as drawn, so a hat scaled onto a small head is not coarser.
        // That size is fixed when the character is built (bakeWorkPos), so breathing never slides it.
        '#include <begin_vertex>\nvWorkRaw = position;\nvWork = workPos;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vWork;
        varying vec3 vWorkRaw;
        uniform sampler2D uWorkMap; uniform float uWorkOn; uniform float uWorkSloped;
        uniform sampler2D uEngraveMap; uniform float uEngraveOn; uniform float uEngraveSloped; uniform vec3 uEngrave;
        float a3Work = 0.5;
        float a3Height = 0.5;
        float a3Cut = 0.0;
        #define A3_ENGRAVE_FREQ 0.6
        vec2 a3dH = vec2(0.0);
        ${NOISE_GLSL}
        ${TRIPLANAR_GLSL}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 a3WdX = dFdx(vWork);
        vec3 a3WdY = dFdy(vWork);
        vec3 a3TriW = a3TriWeights(normalize(cross(a3WdX, a3WdY)));
        vec4 a3T = a3TriTile(uWorkMap, vWork * ${look.freq.toFixed(1)}, a3TriW, vec3(0.0, 0.37, 0.71), uWorkSloped);
        float a3Tile = a3T.x;
        // Engraving: the same size on every material, cut in and inlaid with the trim colour.
        vec4 a3E = a3TriTile(uEngraveMap, vWork * A3_ENGRAVE_FREQ, a3TriW, vec3(0.0, 0.29, 0.53), uEngraveSloped);
        // Tone on tone: cut in and only lightly touched with the trim colour, so it reads up close
        // without taking over the piece.
        a3Cut = uEngraveOn * smoothstep(0.35, 0.65, a3E.x);
        a3Height = mix(0.5, a3Tile, uWorkOn) - a3Cut * 0.2;
        // The height's slope on the piece itself, carried onto the screen through how the piece
        // lies there. (Taking it from neighbouring pixels made the bumps crawl as the piece moved.)
        float a3CutT = clamp((a3E.x - 0.35) / 0.3, 0.0, 1.0);
        vec3 a3HGrad = a3T.yzw * ${look.freq.toFixed(1)} * uWorkOn - a3E.yzw * A3_ENGRAVE_FREQ * uEngraveOn * 6.0 * a3CutT * (1.0 - a3CutT) / 0.3 * 0.2;
        a3dH = vec2(dot(a3HGrad, a3WdX), dot(a3HGrad, a3WdY));
        if (uWorkOn < 0.5) {${coded}
        } else {
          diffuseColor.rgb *= 1.0 - ${look.pits.toFixed(2)} * smoothstep(0.5, 0.1, a3Tile);
        }
        diffuseColor.rgb = mix(diffuseColor.rgb * (1.0 - a3Cut * 0.18), uEngrave, a3Cut * 0.16);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = uWorkOn > 0.5
          ? clamp(roughnessFactor + ${look.rough.toFixed(2)} * (0.5 - a3Height), 0.05, 1.0)
          : clamp(roughnessFactor + ${kind === 'metal' ? '0.3 * (a3Work - 0.5)' : kind === 'cloth' ? '-0.1 * a3Work' : '0.0'}, 0.05, 1.0);
        roughnessFactor = mix(roughnessFactor, 0.22, a3Cut * 0.4);`,
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, 0.9, a3Cut * 0.3);`,
      )
      .replace('#include <lights_physical_fragment>', `${SPECULAR_AA_GLSL}\n#include <lights_physical_fragment>`)
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          vec3 a3Sx = dFdx(-vViewPosition);
          vec3 a3Sy = dFdy(-vViewPosition);
          vec3 a3R1 = cross(a3Sy, normal);
          vec3 a3R2 = cross(normal, a3Sx);
          float a3Det = dot(a3Sx, a3R1);
          vec3 a3Grad = sign(a3Det) * (a3dH.x * a3R1 + a3dH.y * a3R2) * ${look.bump.toFixed(4)};
          normal = normalize(abs(a3Det) * normal - a3Grad);
        }`,
      )
  }
  material.customProgramCacheKey = () => `avatar3d-gear-${kind}-5`
  return material
}

/**
 * Fix where each gear surface samples its tiles: the piece's own points at the size they are drawn
 * on the finished character (a hat scaled onto a small head is not coarser). Called once the
 * character is built and standing at rest, so breathing and other live scaling never slide the
 * texture across the piece.
 */
export function bakeWorkPos(root: Object3D): void {
  root.updateMatrixWorld(true)
  const scale = new Vector3()
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return
    if (!([o.material].flat() as Material[]).some((m) => m.userData.workUniforms)) return
    const pos = o.geometry.getAttribute('position')
    if (!pos) return
    const s = scale.setFromMatrixScale(o.matrixWorld).x
    const out = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      out[i * 3] = pos.getX(i) * s
      out[i * 3 + 1] = pos.getY(i) * s
      out[i * 3 + 2] = pos.getZ(i) * s
    }
    o.geometry.setAttribute('workPos', new BufferAttribute(out, 3))
  })
}

export interface ShellMaterialOptions {
  base: string
  /** Colour that gathers in creases and under overhangs. */
  shade: string
  highlight: string
  markingColor?: string
  marking?: ShellMarking
  /** Base colour of the other half, for the split marking. */
  splitBase?: string
  finish?: ShellFinish
  /** Fine grain strength. */
  grain?: number
  /** Colour of the soft membrane at the joints. */
  soft?: string
  /** How strongly the shell is pebbled and mottled (0 for smooth parts such as the belly). */
  detail?: number
  /** Size of the marking: above 1 is a bigger, sparser pattern. */
  markingScale?: number
  /** Thin enough for light to come through at the edges (antennae, fins, membrane). */
  thin?: boolean
}

/** Set a shell material's colours, finish and marking. Used to make one and to repaint it. */
export function paintShell(material: MeshPhysicalMaterial, o: ShellMaterialOptions): void {
  const finish = o.finish ?? 'satin'
  material.color.set(o.base)
  material.sheenColor.set(o.highlight)
  // Soft plastic clay: a smooth satin body under a tight, glossy clear coat, so highlights sit
  // on top as one clean sheen. The bounce light from the studio picture comes up a little too.
  Object.assign(material, { roughness: 0.4, metalness: 0, clearcoat: 0.75, clearcoatRoughness: 0.14, sheen: 0.3, sheenRoughness: 0.55, iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 1.35 })
  if (finish === 'glossy') Object.assign(material, { roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.07 })
  if (finish === 'pearl') Object.assign(material, { roughness: 0.34, clearcoat: 0.75, clearcoatRoughness: 0.14, iridescence: 1, iridescenceIOR: 1.6 })
  // Polished metal that still reads as the shell's colour: not a full mirror, which shows the
  // room as blotches on rounded shells.
  if (finish === 'chrome') Object.assign(material, { roughness: 0.2, metalness: 0.45, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0, envMapIntensity: 2.2 })
  const u = material.userData.uniforms as ShellUniforms
  u.uShade.value.set(o.shade)
  u.uMark.value.set(o.markingColor ?? o.shade)
  u.uSplit.value.set(o.splitBase ?? o.base)
  u.uSoft.value.set(o.soft ?? o.shade)
  u.uMarking.value = MARKING_INDEX[o.marking ?? 'none']
  const marking = o.marking
  material.userData.marking = marking
  u.uMarkMap.value = isTextureMarking(marking)
    ? markingMask(marking, (mask) => {
        // Still the same marking once it arrives (a repaint may have changed it meanwhile).
        if (material.userData.marking === marking) u.uMarkMap.value = mask
      })
    : NO_MARK
  u.uMarkScale.value = 1 / Math.min(1.8, Math.max(0.5, o.markingScale ?? 1))
  u.uGrain.value = (o.grain ?? (finish === 'chrome' ? 0.015 : 0.07)) * CLAY_GRAIN
  // Polished finishes keep a smoother shell, so their reflections stay clean.
  u.uDetail.value = (o.detail ?? 1) * (finish === 'chrome' ? 0.3 : finish === 'glossy' || finish === 'pearl' ? 0.6 : 1) * CLAY_DETAIL
  u.uGlow.value = finish === 'glow' ? 0.45 : 0
  u.uMarkGlow.value = o.marking === 'circuit' ? 0.35 : 0
  u.uThin.value = o.thin ? 1 : 0
  // Water beads on the shell, less so on polished metal; the plain belly and brows stay dry-looking.
  u.uWet.value = (o.detail ?? 1) === 0 ? 0 : finish === 'chrome' ? 0.4 : 1
  // A change of finish can switch shader features on or off.
  material.needsUpdate = true
}

/**
 * The shell reads as smooth plastic clay, not leathery: the fine grain, pebbles, mottling and
 * detail tile all stay, but faint (shares of their full strength).
 */
const CLAY_GRAIN = 0.3
const CLAY_DETAIL = 0.35

const DIRECT_DIFFUSE = `float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;`

/**
 * three's physical lighting with the key light's diffuse wrapped a little past the shadow edge,
 * plus (with `band`) a richer, deeper band of the surface's own colour where light turns to
 * shadow: the look of light soaking into the surface and coming back out, without a
 * subsurface pass. Highlights and the clear coat still use the true angle.
 */
function wrappedLighting(band: number): string {
  const chunk = ShaderChunk.lights_physical_pars_fragment
  if (!chunk.includes(DIRECT_DIFFUSE)) throw new Error('avatar3d: three lighting chunk changed; update wrappedLighting')
  return chunk.replace(
    DIRECT_DIFFUSE,
    `float a3NL = dot( geometryNormal, directLight.direction );
	float dotNL = saturate( a3NL );
	vec3 irradiance = saturate( ( a3NL + 0.32 ) / 1.32 ) * directLight.color;
	${
    band > 0
      ? `vec3 a3Deep = material.diffuseColor * material.diffuseColor / max( max( material.diffuseColor.r, max( material.diffuseColor.g, material.diffuseColor.b ) ), 0.05 );
	irradiance += directLight.color * a3Deep * smoothstep( -0.45, 0.05, a3NL ) * smoothstep( 0.45, 0.0, a3NL ) * ${band.toFixed(2)};`
      : ''
  }`,
  )
}

/** How strongly the baked shading darkens (1 is the full measured amount). */
const BAKE_STRENGTH = 0.9

type ShellUniforms = ReturnType<typeof shellUniforms>
const shellUniforms = () => ({
  uShade: { value: new Color() },
  uMark: { value: new Color() },
  uSplit: { value: new Color() },
  uSoft: { value: new Color() },
  uMarking: { value: 0 },
  uMarkScale: { value: 1 },
  uGrain: { value: 0.07 },
  uDetail: { value: 1 },
  uGlow: { value: 0 },
  uMarkGlow: { value: 0 },
  // Spheres standing in for the body's bulk, which shade the shell where parts crowd it.
  uOcc: { value: Array.from({ length: OCCLUDERS }, () => new Vector4(0, -1000, 0, 0)) },
  uOccN: { value: 0 },
  // 1 once the body's creases are baked into the vertices: a sphere then shades only what moves
  // apart from it (an arm against the body, the body against an arm).
  uBaked: { value: 0 },
  uThin: { value: 0 },
  uWet: { value: 0 },
  uMarkMap: { value: NO_MARK as Texture },
  // Shared by every shell, so the tile is swapped in once when it arrives.
  uDetailMap: detailUniform,
  uDetailOn: detailOnUniform,
  uDetailSloped: detailSlopeUniform,
})

/** Let a character's shell materials shade themselves with its own occluder spheres. */
const SHELL_SLOTS = ['shell', 'fin', 'belly', 'brow'] as const

export function shadeWith(materials: Record<MaterialSlot, Material>, spheres: Vector4[], count: number, baked = false): void {
  for (const slot of SHELL_SLOTS) {
    const u = (materials[slot] as MeshPhysicalMaterial).userData.uniforms as ShellUniforms
    u.uOcc.value = spheres
    u.uOccN.value = count
    u.uBaked.value = baked ? 1 : 0
  }
}

export function shellMaterial(o: ShellMaterialOptions): MeshPhysicalMaterial {
  const material = new MeshPhysicalMaterial({ vertexColors: true })
  shellDetail()
  const uniforms = shellUniforms()
  material.userData.uniforms = uniforms
  // Every mesh drawn with it carries a `bake` attribute (bake.ts).
  material.userData.bakedAo = true
  paintShell(material, o)
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 restPos;\nattribute vec2 bake;\nvarying vec3 vRest;\nvarying vec2 vBake;\nvarying vec3 vA3World;\nvarying vec3 vA3Normal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = restPos;\nvBake = bake;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvA3World = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvA3Normal = normalize(mat3(modelMatrix) * objectNormal);',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <lights_physical_pars_fragment>', wrappedLighting(0.55))
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vRest;
        varying vec2 vBake;
        varying vec3 vA3World;
        varying vec3 vA3Normal;
        uniform vec4 uOcc[${OCCLUDERS}];
        uniform int uOccN;
        uniform float uBaked;
        uniform float uThin; uniform float uWet;
        uniform vec3 uShade; uniform vec3 uMark; uniform vec3 uSplit; uniform vec3 uSoft;
        uniform int uMarking; uniform float uMarkScale; uniform float uGrain; uniform float uDetail; uniform float uGlow; uniform float uMarkGlow;
        uniform sampler2D uMarkMap; uniform sampler2D uDetailMap; uniform float uDetailOn; uniform float uDetailSloped;
        // Shell detail tiles about every 0.18 units; image markings about every 1.3.
        #define A3_DETAIL_FREQ 5.5
        #define A3_MARK_FREQ 0.75
        #define A3_DETAIL_BUMP 0.0045
        #define A3_BAKE_STRENGTH ${BAKE_STRENGTH.toFixed(2)}
        float a3Mask = 0.0;
        float a3Soft = 0.0;
        float a3Pebble = 0.0;
        float a3Height = 0.5;
        vec2 a3dH = vec2(0.0);
        // How the rest position changes across one pixel: carries slopes taken on the shell onto the screen.
        vec3 a3RdX = vec3(0.0);
        vec3 a3RdY = vec3(0.0);
        ${NOISE_GLSL}
        ${TRIPLANAR_GLSL}`,
      )
      .replace(
        '#include <color_fragment>',
        `
        a3RdX = dFdx(vRest);
        a3RdY = dFdy(vRest);
        float a3Ao = vColor.r;
        a3Soft = 1.0 - vColor.g;
        a3Pebble = vColor.b * uDetail;
        // Which way the shell faces at rest, for the tiling textures: they stay put however it moves.
        vec3 a3TriW = a3TriWeights(normalize(cross(a3RdX, a3RdY)));
        // Fine shell surface from the detail tile (a height map packed with its slope).
        float a3DetailAmt = uDetailOn * ${CLAY_DETAIL.toFixed(2)} * mix(0.2, 1.0, uDetail * uDetail) * (1.0 - a3Soft * 0.6);
        vec4 a3DT = a3TriTile(uDetailMap, vRest * A3_DETAIL_FREQ, a3TriW, vec3(0.0, 0.37, 0.71), uDetailSloped);
        a3Height = mix(0.5, a3DT.x, a3DetailAmt);
        // Its slope on screen, for the bump below: taken on the shell and carried through how the
        // shell lies on screen, so the bumps stay glued on as it moves (neighbouring pixels made them crawl).
        vec3 a3HGrad = a3DT.yzw * A3_DETAIL_FREQ * a3DetailAmt;
        a3dH = vec2(dot(a3HGrad, a3RdX), dot(a3HGrad, a3RdY));
        // Image markings: the mask's three looks blended, then sharpened back to a clean edge.
        vec3 a3Mp = vRest * uMarkScale * A3_MARK_FREQ;
        float a3MarkTex = texture2D(uMarkMap, a3Mp.yz).r * a3TriW.x + texture2D(uMarkMap, a3Mp.xz + 0.29).r * a3TriW.y + texture2D(uMarkMap, a3Mp.xy + 0.53).r * a3TriW.z;
        vec3 a3Tint = diffuse;
        // The partner colour takes the viewer's right half, as in the 2D drawing.
        if (uMarking == 7 && vRest.x > 0.0) a3Tint = uSplit;
        a3Mask = uMarking == 7 ? 0.0 : uMarking == 9 ? smoothstep(0.38, 0.62, a3MarkTex) : a3Marking(uMarking, vRest * uMarkScale);
        a3Mask *= 1.0 - a3Soft;
        a3Tint = mix(a3Tint, uMark, a3Mask);
        // Shell is never one flat colour: it is a little darker and blotchier along the back and
        // on top, and paler underneath.
        float a3Mottle = a3Noise(vRest * 13.0 + 3.0) * 0.6 + a3Noise(vRest * 29.0) * 0.4;
        float a3Back = smoothstep(0.12, -0.2, vRest.z) * 0.6 + 0.4;
        a3Tint *= 1.0 - uDetail * 0.11 * a3Back * smoothstep(0.42, 0.74, a3Mottle);
        // Pebbles: darker in the pits between them.
        float a3Lump = a3Noise(vRest * 30.0 + 5.0);
        a3Tint *= 1.0 - a3Pebble * 0.09 * (1.0 - smoothstep(0.25, 0.6, a3Lump));
        float a3Grain = a3Noise(vRest * 90.0) * 0.6 + a3Noise(vRest * 240.0) * 0.4;
        a3Tint *= 1.0 + uGrain * (a3Grain - 0.5);
        // Pores and pits from the detail tile sit a little darker.
        a3Tint *= 1.0 - 0.08 * smoothstep(0.5, 0.15, a3Height);
        // Joints are soft, pale membrane, not shell.
        a3Tint = mix(a3Tint, uSoft, a3Soft * 0.8);
        // Creases take the palette's shade colour instead of going grey.
        diffuseColor.rgb = mix(uShade * 0.62, a3Tint, a3Ao);
        `,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        // Fine leathery grain, so highlights break up the way they do on the painted references.
        vec3 a3Bump = vec3(a3Noise(vRest * 120.0 + 11.0), a3Noise(vRest * 120.0 + 37.0), a3Noise(vRest * 120.0 + 71.0)) - 0.5;
        normal = normalize(normal + a3Bump * uGrain * mix(1.1, 0.6, uDetailOn * ${CLAY_DETAIL.toFixed(2)}));
        // The detail tile's ridges and pores catch the light (bump as three's bumpMap does it, from
        // the slope worked out above).
        vec3 a3Sx = dFdx(-vViewPosition);
        vec3 a3Sy = dFdy(-vViewPosition);
        {
          vec3 a3R1 = cross(a3Sy, normal);
          vec3 a3R2 = cross(normal, a3Sx);
          float a3Det = dot(a3Sx, a3R1);
          vec3 a3Grad = sign(a3Det) * (a3dH.x * a3R1 + a3dH.y * a3R2) * A3_DETAIL_BUMP;
          normal = normalize(abs(a3Det) * normal - a3Grad);
        }
        // Pebbled shell: the surface tips away from each lump, strongest on the claws. The lumps'
        // slope is in rest space, so it is carried onto the screen the same way as the tile's, and
        // the lumps turn with the claw instead of staying lit from one fixed side.
        if (a3Pebble > 0.01) {
          vec3 a3P = vRest * 30.0 + 5.0;
          vec3 a3Slope = vec3(a3Noise(a3P + vec3(0.5, 0.0, 0.0)) - a3Noise(a3P - vec3(0.5, 0.0, 0.0)), a3Noise(a3P + vec3(0.0, 0.5, 0.0)) - a3Noise(a3P - vec3(0.0, 0.5, 0.0)), a3Noise(a3P + vec3(0.0, 0.0, 0.5)) - a3Noise(a3P - vec3(0.0, 0.0, 0.5)));
          vec2 a3dL = vec2(dot(a3Slope, a3RdX), dot(a3Slope, a3RdY)) * 30.0;
          vec3 a3R1 = cross(a3Sy, normal);
          vec3 a3R2 = cross(normal, a3Sx);
          float a3Det = dot(a3Sx, a3R1);
          vec3 a3Grad = sign(a3Det) * (a3dL.x * a3R1 + a3dL.y * a3R2) * (a3Pebble * 0.42 / 30.0);
          normal = normalize(abs(a3Det) * normal - a3Grad);
        }
        // Undersides sink toward the shade colour, which gives the forms weight without an occlusion pass.
        float a3Under = smoothstep(0.25, -0.95, inverseTransformDirection(normal, viewMatrix).y);
        diffuseColor.rgb = mix(diffuseColor.rgb, uShade * 0.72, a3Under * 0.62);`,
      )
      .replace(
        '#include <lights_physical_fragment>',
        `${SPECULAR_AA_GLSL}
        #include <lights_physical_fragment>
        #ifdef USE_CLEARCOAT
        // Wet shell: the clear coat is sharper in patches, as if water has beaded there.
        material.clearcoatRoughness = clamp(material.clearcoatRoughness * mix(1.0, 0.35 + 1.1 * a3Noise(vRest * 9.0 + 13.0), uWet), 0.03, 1.0);
        #endif`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + uGrain * 1.6 * (a3Grain - 0.5) + a3Soft * 0.3 + a3Pebble * 0.1 * (0.5 - a3Lump) + 0.12 * (0.5 - a3Height), 0.04, 1.0);`,
      )
      .replace(
        '#include <aomap_fragment>',
        `#include <aomap_fragment>
        // Soft contact shadow: how much of the sky around this point the body's other parts hide.
        float a3Occ = 1.0;
        vec3 a3N = normalize(vA3Normal);
        float a3Group = floor(vBake.y + 0.5);
        for (int i = 0; i < ${OCCLUDERS}; i++) {
          if (i >= uOccN) break;
          float a3SphereGroup = floor(uOcc[i].w / 10.0);
          // The bake already holds what moves together.
          if (uBaked > 0.5 && a3SphereGroup == a3Group) continue;
          vec3 a3D = uOcc[i].xyz - vA3World;
          float a3L2 = max(dot(a3D, a3D), 1e-6);
          float a3R = uOcc[i].w - a3SphereGroup * 10.0;
          a3Occ *= 1.0 - clamp(1.5 * max(dot(a3N, a3D * inversesqrt(a3L2)), 0.0) * a3R * a3R / a3L2, 0.0, 0.85);
        }
        a3Occ = max(a3Occ, 0.3);
        // Baked: the share of the sky this point sees past the rest of its own part of the body.
        // It also dims direct light a fair way, which is what gives creases their painted depth.
        float a3Baked = mix(1.0, pow(vBake.x, 1.5), A3_BAKE_STRENGTH);
        reflectedLight.indirectDiffuse *= a3Occ * a3Baked;
        reflectedLight.indirectSpecular *= a3Occ * a3Baked;
        reflectedLight.directDiffuse *= mix(1.0, a3Occ, 0.55) * mix(1.0, a3Baked, 0.75);
        reflectedLight.directSpecular *= mix(1.0, a3Occ, 0.4) * mix(1.0, a3Baked, 0.6);
        a3Occ *= a3Baked;
        // Light through thin parts: fins, feelers and soft joints glow warm toward their edges.
        float a3Thin = max(uThin, a3Soft * 0.6);
        if (a3Thin > 0.0) {
          float a3Rim = 1.0 - abs(dot(normal, normalize(vViewPosition)));
          reflectedLight.directDiffuse += diffuseColor.rgb * vec3(1.0, 0.86, 0.72) * a3Thin * (0.1 + 0.55 * a3Rim * a3Rim) * a3Occ;
        }`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * uGlow + uMark * a3Mask * uMarkGlow;
        // Soft rim: a bright edge round the silhouette, stronger on the tops of forms, so the
        // character lifts off the background.
        {
          float a3Fr = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0);
          totalEmissiveRadiance += mix(diffuseColor.rgb, vec3(1.0), 0.3) * a3Fr * 0.22 * (0.5 + 0.5 * normal.y);
        }`,
      )
  }
  material.customProgramCacheKey = () => 'avatar3d-shell-11'
  return material
}

/**
 * Eyes in the reference style: a deep iris with a dark rim and pale streaks, a large pupil and
 * one crisp highlight on its upper edge. `stretch` is how far the eye socket is widened, so the
 * iris stays round on an oval eye.
 */
function eyeSwatch(color: AvatarEyeColor) {
  // The approved references paint green eyes as a deep olive, darker than the 2D swatch.
  return color === 'emerald' ? { inner: '#d9f2a6', mid: '#5f9a2e', outer: '#2f5216', ring: '#0f1f06' } : EYE_COLOR_SWATCH[color]
}

/** Change an eye's colour and pupil size in place. */
export function paintEye(material: MeshPhysicalMaterial, color: AvatarEyeColor, pupilScale = 1): void {
  const swatch = eyeSwatch(color)
  const u = material.userData.uniforms as Record<'uInner' | 'uMid' | 'uOuter' | 'uRing', { value: Color }> & { uPupil: { value: number } }
  u.uInner.value.set(swatch.inner)
  u.uMid.value.set(swatch.mid)
  u.uOuter.value.set(swatch.outer)
  u.uRing.value.set(swatch.ring)
  u.uPupil.value = pupilScale
}

export function eyeMaterial(color: AvatarEyeColor, pupilScale = 1, stretch: [number, number] = [1, 1]): MeshPhysicalMaterial {
  const swatch = eyeSwatch(color)
  // Glass over the eye: a tight clear coat picks up the studio's lights as soft reflections. The
  // crisp catchlights and the window reflection are painted, so they never smear into blotches.
  const material = new MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.025, envMapIntensity: 1.6 })
  const uniforms = {
    uInner: { value: new Color(swatch.inner) },
    uMid: { value: new Color(swatch.mid) },
    uOuter: { value: new Color(swatch.outer) },
    uRing: { value: new Color(swatch.ring) },
    uPupil: { value: pupilScale },
    uStretch: { value: new Vector2(stretch[0], stretch[1]) },
  }
  material.userData.uniforms = uniforms
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vEye;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvEye = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <lights_physical_pars_fragment>', wrappedLighting(0))
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vEye;
        uniform vec3 uInner; uniform vec3 uMid; uniform vec3 uOuter; uniform vec3 uRing; uniform float uPupil; uniform vec2 uStretch;
        float a3Highlight = 0.0;
        float a3Dark = 0.0;`,
      )
      .replace(
        '#include <color_fragment>',
        `
        vec3 a3Dir = normalize(vEye);
        // Distance from the eye's axis as it appears on the widened eye, in eye radii.
        vec2 a3At = a3Dir.xy * uStretch;
        float a3Rho = a3Dir.z > 0.0 ? length(a3At) : 9.0;
        float a3Iris = 0.68;
        float a3Pupil = 0.36 * uPupil;
        float a3T = clamp((a3Rho - a3Pupil) / (a3Iris - a3Pupil), 0.0, 1.0);
        float a3Angle = atan(a3At.y, a3At.x);
        float a3Spoke = pow(sin(a3Angle * 19.0) * 0.5 + 0.5, 2.0) * 0.6 + pow(sin(a3Angle * 43.0 + 1.3) * 0.5 + 0.5, 3.0) * 0.4;
        vec3 a3Deep = mix(uMid, uOuter, 0.38);
        vec3 a3Col = mix(mix(a3Deep, uMid, 0.7), a3Deep, smoothstep(0.0, 0.5, a3T));
        a3Col = mix(a3Col, uOuter, smoothstep(0.5, 1.0, a3T) * 0.75);
        a3Col = mix(a3Col, mix(uMid, uInner, 0.45), 0.42 * a3Spoke * smoothstep(0.05, 0.3, a3T) * (1.0 - smoothstep(0.55, 0.95, a3T)));
        // Lit from above: the lower half of the iris catches the light.
        a3Col *= 0.68 + 0.22 * smoothstep(0.5, -0.6, a3At.y / a3Iris);
        a3Col = mix(a3Col, uRing, smoothstep(0.72, 1.0, a3T) * 0.9);
        // Light through the lens: the iris glows on the side away from the light.
        a3Col += mix(uMid, uInner, 0.6) * 0.55 * smoothstep(0.2, 0.95, a3T) * smoothstep(0.1, -0.7, a3At.y / a3Iris) * smoothstep(-0.2, 0.6, a3At.x / a3Iris + 0.3);
        // Soft warm shade toward the back of the white, as if the lids shadow it, and a faint
        // darker ring where the white meets the iris.
        vec3 a3White = mix(vec3(1.0, 0.995, 1.0), vec3(0.86, 0.8, 0.82), smoothstep(0.85, 1.3, a3Rho));
        a3White *= 1.0 - 0.22 * (1.0 - smoothstep(a3Iris, a3Iris + 0.1, a3Rho));
        vec3 a3Eye = mix(a3Col, a3White, smoothstep(a3Iris - 0.012, a3Iris + 0.012, a3Rho));
        a3Eye = mix(vec3(0.02, 0.015, 0.02), a3Eye, smoothstep(a3Pupil - 0.012, a3Pupil + 0.012, a3Rho));
        a3Dark = 1.0 - smoothstep(a3Pupil - 0.012, a3Pupil + 0.012, a3Rho);
        // One crisp catchlight on the pupil's upper edge, a small second one low on the iris, and a
        // soft window reflection curving over the top of the cornea: what makes the eye read as glass.
        a3Highlight = 1.0 - smoothstep(0.085, 0.1, length(a3At - a3Pupil * vec2(-0.5, 0.7)));
        a3Highlight = max(a3Highlight, 0.7 * (1.0 - smoothstep(0.035, 0.05, length(a3At - vec2(0.2, -0.24)))));
        {
          vec2 a3Q = a3At - vec2(-0.05, 0.62);
          a3Q.y += 0.35 * a3Q.x * a3Q.x;
          float a3Win = (1.0 - smoothstep(0.42, 0.6, abs(a3Q.x))) * (1.0 - smoothstep(0.05, 0.12, abs(a3Q.y)));
          a3Highlight = max(a3Highlight, 0.32 * a3Win * step(0.0, a3Dir.z));
        }
        // The lids sit over the eye and shade it where they meet it: a soft shadow under the upper
        // lid, a fainter one over the lower, so the eye reads as set into the face, not laid on it.
        float a3Lid = smoothstep(0.25, 0.92, a3Dir.y) * 0.42 + smoothstep(-0.45, -0.95, a3Dir.y) * 0.18;
        a3Eye *= 1.0 - a3Lid * (1.0 - a3Dark);
        diffuseColor.rgb = mix(a3Eye, vec3(1.0), a3Highlight);
        `,
      )
      // The pupil stays a flat black: no sheen across it.
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 1.0, a3Dark);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.9) * a3Highlight;')
  }
  material.customProgramCacheKey = () => 'avatar3d-eye-8'
  return material
}

export interface LookMaterials {
  palette: ShellPalette
  finish: ShellFinish
  marking: ShellMarking
  eyeColor: AvatarEyeColor
  pupilScale?: number
  /** How far the eye socket is widened and heightened. */
  eyeStretch?: [number, number]
  /** Palette whose belly tones to use, instead of the shell's own. */
  bellyColor?: string
  /** Palette whose colour the marking is drawn in, instead of the shell's own marking colour. */
  markingColor?: string
  markingScale?: number
}

function shellOptions(look: LookMaterials): Record<'shell' | 'belly' | 'brow', ShellMaterialOptions> {
  const p = look.palette
  const split = SHELL_PALETTE_MAP[p.splitWith] ?? p
  const belly = (look.bellyColor && SHELL_PALETTE_MAP[look.bellyColor]) || p
  const mark = look.markingColor ? SHELL_PALETTE_MAP[look.markingColor] : undefined
  // Stardust and circuit traces are drawn in light, as in the 2D art; the rest in the darker marking colour.
  const light = look.marking === 'stardust' || look.marking === 'circuit'
  return {
    shell: {
      base: p.base,
      shade: p.shade,
      highlight: p.highlight,
      marking: look.marking,
      markingColor: mark ? (light ? mark.highlight : mark.base) : light ? p.highlight : p.marking,
      markingScale: look.markingScale,
      splitBase: split.base,
      finish: look.finish,
      soft: '#' + new Color(p.base).lerp(new Color(belly.bellyShade), 0.55).getHexString(),
    },
    belly: { base: belly.belly, shade: belly.bellyShade, highlight: '#ffffff', finish: 'satin', grain: 0.04, detail: 0 },
    brow: { base: '#' + new Color(p.base).lerp(new Color(p.shade), 0.6).getHexString(), shade: p.shade, highlight: p.highlight, finish: 'satin', detail: 0 },
  }
}

/** The full material set for one character. */
export function buildMaterials(look: LookMaterials): Record<MaterialSlot, Material> {
  const p = look.palette
  const o = shellOptions(look)
  return {
    shell: shellMaterial(o.shell),
    fin: shellMaterial({ ...o.shell, thin: true }),
    belly: shellMaterial(o.belly),
    brow: shellMaterial(o.brow),
    eye: eyeMaterial(look.eyeColor, look.pupilScale, look.eyeStretch),
    mouth: new MeshStandardMaterial({ color: new Color(p.deep), roughness: 0.7 }),
    teeth: new MeshStandardMaterial({ color: new Color('#fffaf0'), roughness: 0.35 }),
    tongue: new MeshStandardMaterial({ color: new Color('#ff7d93'), roughness: 0.5 }),
    glow: new MeshStandardMaterial({ color: new Color('#bff6ff'), emissive: new Color('#22d3ee'), emissiveIntensity: 2.2, roughness: 0.3 }),
  }
}

/** Recolour a character's materials in place: no geometry is touched, so it is instant. */
export function repaintMaterials(materials: Record<MaterialSlot, Material>, look: LookMaterials): void {
  const o = shellOptions(look)
  paintShell(materials.shell as MeshPhysicalMaterial, o.shell)
  paintShell(materials.fin as MeshPhysicalMaterial, { ...o.shell, thin: true })
  paintShell(materials.belly as MeshPhysicalMaterial, o.belly)
  paintShell(materials.brow as MeshPhysicalMaterial, o.brow)
  paintEye(materials.eye as MeshPhysicalMaterial, look.eyeColor, look.pupilScale)
  ;(materials.mouth as MeshStandardMaterial).color.set(look.palette.deep)
}

export function disposeMaterials(materials: Record<string, Material>): void {
  for (const m of Object.values(materials)) m.dispose()
}
