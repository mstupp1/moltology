/**
 * Materials. One physically based shell material carries the palette, finish and marking; the
 * marking is painted in the shader from each vertex's rest position, so patterns stay glued to
 * the shell in any pose and need no textures.
 */
import { Color, MeshPhysicalMaterial, MeshStandardMaterial, type Material, Vector2 } from 'three'
import type { ShellFinish, ShellMarking, ShellPalette } from '../avatar/traits'
import { SHELL_PALETTE_MAP } from '../avatar/traits'
import { EYE_COLOR_SWATCH, type AvatarEyeColor } from '../avatar/parts'
import type { MaterialSlot } from './rig'

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

/**
 * Give a gear material a worked surface, drawn in the shader from each point's own position so it
 * needs no textures: `metal` is brushed along its length with a slightly uneven tone, `cloth` is
 * a fine weave.
 */
export function workedSurface<T extends MeshPhysicalMaterial>(material: T, kind: 'metal' | 'cloth'): T {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWork;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWork = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWork;\nfloat a3Work = 0.0;\n${NOISE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        kind === 'metal'
          ? `#include <color_fragment>
        // Brushed along the piece, with soft patches where the tone shifts like worked metal.
        a3Work = a3Noise(vec3(vWork.x * 14.0, vWork.y * 260.0, vWork.z * 14.0)) * 0.7 + a3Noise(vWork * 420.0) * 0.3;
        diffuseColor.rgb *= 0.93 + 0.14 * a3Noise(vWork * 11.0 + 2.0) + 0.05 * (a3Work - 0.5);`
          : `#include <color_fragment>
        // Over and under threads.
        vec3 a3Thread = vWork * 380.0;
        a3Work = (sin(a3Thread.x + a3Thread.z) * sin(a3Thread.y)) * 0.5 + 0.5;
        diffuseColor.rgb *= 0.88 + 0.2 * a3Work;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        kind === 'metal'
          ? '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + 0.3 * (a3Work - 0.5), 0.05, 1.0);'
          : '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor - 0.1 * a3Work, 0.05, 1.0);',
      )
  }
  material.customProgramCacheKey = () => `avatar3d-gear-${kind}-1`
  return material
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
}

/** Set a shell material's colours, finish and marking. Used to make one and to repaint it. */
export function paintShell(material: MeshPhysicalMaterial, o: ShellMaterialOptions): void {
  const finish = o.finish ?? 'satin'
  material.color.set(o.base)
  material.sheenColor.set(o.highlight)
  Object.assign(material, { roughness: 0.5, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.45, sheen: 0.55, sheenRoughness: 0.55, iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 1 })
  if (finish === 'glossy') Object.assign(material, { roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.12 })
  if (finish === 'pearl') Object.assign(material, { roughness: 0.34, clearcoat: 0.7, clearcoatRoughness: 0.2, iridescence: 1, iridescenceIOR: 1.6 })
  // Polished metal that still reads as the shell's colour: not a full mirror, which shows the
  // room as blotches on rounded shells.
  if (finish === 'chrome') Object.assign(material, { roughness: 0.2, metalness: 0.45, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0, envMapIntensity: 3.5 })
  const u = material.userData.uniforms as ShellUniforms
  u.uShade.value.set(o.shade)
  u.uMark.value.set(o.markingColor ?? o.shade)
  u.uSplit.value.set(o.splitBase ?? o.base)
  u.uSoft.value.set(o.soft ?? o.shade)
  u.uMarking.value = MARKING_INDEX[o.marking ?? 'none']
  u.uMarkScale.value = 1 / Math.min(1.8, Math.max(0.5, o.markingScale ?? 1))
  u.uGrain.value = o.grain ?? (finish === 'chrome' ? 0.015 : 0.07)
  // Polished finishes keep a smoother shell, so their reflections stay clean.
  u.uDetail.value = (o.detail ?? 1) * (finish === 'chrome' ? 0.3 : finish === 'glossy' || finish === 'pearl' ? 0.6 : 1)
  u.uGlow.value = finish === 'glow' ? 0.45 : 0
  u.uMarkGlow.value = o.marking === 'circuit' ? 0.35 : 0
  // A change of finish can switch shader features on or off.
  material.needsUpdate = true
}

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
})

export function shellMaterial(o: ShellMaterialOptions): MeshPhysicalMaterial {
  const material = new MeshPhysicalMaterial({ vertexColors: true })
  const uniforms = shellUniforms()
  material.userData.uniforms = uniforms
  paintShell(material, o)
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 restPos;\nvarying vec3 vRest;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = restPos;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vRest;
        uniform vec3 uShade; uniform vec3 uMark; uniform vec3 uSplit; uniform vec3 uSoft;
        uniform int uMarking; uniform float uMarkScale; uniform float uGrain; uniform float uDetail; uniform float uGlow; uniform float uMarkGlow;
        float a3Mask = 0.0;
        float a3Soft = 0.0;
        float a3Pebble = 0.0;
        ${NOISE_GLSL}`,
      )
      .replace(
        '#include <color_fragment>',
        `
        float a3Ao = vColor.r;
        a3Soft = 1.0 - vColor.g;
        a3Pebble = vColor.b * uDetail;
        vec3 a3Tint = diffuse;
        // The partner colour takes the viewer's right half, as in the 2D drawing.
        if (uMarking == 7 && vRest.x > 0.0) a3Tint = uSplit;
        a3Mask = uMarking == 7 ? 0.0 : a3Marking(uMarking, vRest * uMarkScale) * (1.0 - a3Soft);
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
        normal = normalize(normal + a3Bump * uGrain * 1.1);
        // Pebbled shell: the surface tips away from each lump, strongest on the claws.
        if (a3Pebble > 0.01) {
          vec3 a3P = vRest * 30.0 + 5.0;
          vec3 a3Slope = vec3(a3Noise(a3P + vec3(0.5, 0.0, 0.0)) - a3Noise(a3P - vec3(0.5, 0.0, 0.0)), a3Noise(a3P + vec3(0.0, 0.5, 0.0)) - a3Noise(a3P - vec3(0.0, 0.5, 0.0)), a3Noise(a3P + vec3(0.0, 0.0, 0.5)) - a3Noise(a3P - vec3(0.0, 0.0, 0.5)));
          normal = normalize(normal - (viewMatrix * vec4(a3Slope, 0.0)).xyz * a3Pebble * 0.42);
        }
        // Undersides sink toward the shade colour, which gives the forms weight without an occlusion pass.
        float a3Under = smoothstep(0.25, -0.95, inverseTransformDirection(normal, viewMatrix).y);
        diffuseColor.rgb = mix(diffuseColor.rgb, uShade * 0.72, a3Under * 0.62);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + uGrain * 1.6 * (a3Grain - 0.5) + a3Soft * 0.3 + a3Pebble * 0.1 * (0.5 - a3Lump), 0.04, 1.0);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * uGlow + uMark * a3Mask * uMarkGlow;`,
      )
  }
  material.customProgramCacheKey = () => 'avatar3d-shell-4'
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
  // Matte enough that the room does not print window shapes on the eye; the highlight is painted.
  const material = new MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.4, clearcoat: 0.1, clearcoatRoughness: 0.4, envMapIntensity: 0.25 })
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
        float a3Iris = 0.6;
        float a3Pupil = 0.31 * uPupil;
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
        // Soft warm shade toward the back of the white, as if the lids shadow it.
        vec3 a3White = mix(vec3(1.0), vec3(0.84, 0.79, 0.8), smoothstep(0.75, 1.25, a3Rho));
        vec3 a3Eye = mix(a3Col, a3White, smoothstep(a3Iris - 0.012, a3Iris + 0.012, a3Rho));
        a3Eye = mix(vec3(0.02, 0.015, 0.02), a3Eye, smoothstep(a3Pupil - 0.012, a3Pupil + 0.012, a3Rho));
        a3Dark = 1.0 - smoothstep(a3Pupil - 0.012, a3Pupil + 0.012, a3Rho);
        a3Highlight = 1.0 - smoothstep(0.095, 0.11, length(a3At - a3Pupil * vec2(-0.5, 0.7)));
        diffuseColor.rgb = mix(a3Eye, vec3(1.0), a3Highlight);
        `,
      )
      // The pupil stays a flat black: no sheen across it.
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 1.0, a3Dark);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.9) * a3Highlight;')
  }
  material.customProgramCacheKey = () => 'avatar3d-eye-5'
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
  paintShell(materials.belly as MeshPhysicalMaterial, o.belly)
  paintShell(materials.brow as MeshPhysicalMaterial, o.brow)
  paintEye(materials.eye as MeshPhysicalMaterial, look.eyeColor, look.pupilScale)
  ;(materials.mouth as MeshStandardMaterial).color.set(look.palette.deep)
}

export function disposeMaterials(materials: Record<string, Material>): void {
  for (const m of Object.values(materials)) m.dispose()
}
