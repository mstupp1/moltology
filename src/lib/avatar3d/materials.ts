/**
 * Materials. One physically based shell material carries the palette, finish and marking; the
 * marking is painted in the shader from each vertex's rest position, so patterns stay glued to
 * the shell in any pose and need no textures.
 */
import { Color, MeshPhysicalMaterial, MeshStandardMaterial, type Material } from 'three'
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

const NOISE_GLSL = /* glsl */ `
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
      vec3 g = abs(fract(p * 9.0) - 0.5);
      float line = min(smoothstep(0.035, 0.015, g.x) + smoothstep(0.035, 0.015, g.y), 1.0);
      return line * step(0.55, a3Hash(floor(p * 9.0)));
    }
    return 0.0;
  }
`

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
}

export function shellMaterial(o: ShellMaterialOptions): MeshPhysicalMaterial {
  const finish = o.finish ?? 'satin'
  const material = new MeshPhysicalMaterial({
    color: new Color(o.base),
    vertexColors: true,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.25,
    clearcoatRoughness: 0.45,
    sheen: 0.55,
    sheenRoughness: 0.55,
    sheenColor: new Color(o.highlight),
  })
  if (finish === 'glossy') Object.assign(material, { roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.12 })
  if (finish === 'pearl') Object.assign(material, { roughness: 0.34, clearcoat: 0.7, clearcoatRoughness: 0.2, iridescence: 1, iridescenceIOR: 1.6 })
  if (finish === 'chrome') Object.assign(material, { roughness: 0.16, metalness: 1, clearcoat: 0.4, sheen: 0 })
  const glow = finish === 'glow' ? 0.45 : 0
  const circuit = o.marking === 'circuit'

  const uniforms = {
    uShade: { value: new Color(o.shade) },
    uMark: { value: new Color(o.markingColor ?? o.shade) },
    uSplit: { value: new Color(o.splitBase ?? o.base) },
    uMarking: { value: MARKING_INDEX[o.marking ?? 'none'] },
    uGrain: { value: o.grain ?? 0.07 },
    uGlow: { value: glow },
    uMarkGlow: { value: circuit ? 1.4 : 0 },
  }
  material.userData.uniforms = uniforms
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
        uniform vec3 uShade; uniform vec3 uMark; uniform vec3 uSplit;
        uniform int uMarking; uniform float uGrain; uniform float uGlow; uniform float uMarkGlow;
        float a3Mask = 0.0;
        ${NOISE_GLSL}`,
      )
      .replace(
        '#include <color_fragment>',
        `
        float a3Ao = vColor.r;
        vec3 a3Tint = diffuse;
        if (uMarking == 7 && vRest.x < 0.0) a3Tint = uSplit;
        a3Mask = uMarking == 7 ? 0.0 : a3Marking(uMarking, vRest);
        a3Tint = mix(a3Tint, uMark, a3Mask);
        float a3Grain = a3Noise(vRest * 90.0) * 0.6 + a3Noise(vRest * 240.0) * 0.4;
        a3Tint *= 1.0 + uGrain * (a3Grain - 0.5);
        // Creases take the palette's shade colour instead of going grey.
        diffuseColor.rgb = mix(uShade * 0.62, a3Tint, a3Ao);
        `,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        // Undersides sink toward the shade colour, which gives the forms weight without an occlusion pass.
        float a3Under = smoothstep(0.25, -0.95, inverseTransformDirection(normal, viewMatrix).y);
        diffuseColor.rgb = mix(diffuseColor.rgb, uShade * 0.8, a3Under * 0.5);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + uGrain * 1.6 * (a3Grain - 0.5), 0.04, 1.0);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * uGlow + uMark * a3Mask * uMarkGlow;`,
      )
  }
  material.customProgramCacheKey = () => 'avatar3d-shell'
  return material
}

export function eyeMaterial(color: AvatarEyeColor, pupilScale = 1): MeshPhysicalMaterial {
  const swatch = EYE_COLOR_SWATCH[color]
  const material = new MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04 })
  const uniforms = {
    uInner: { value: new Color(swatch.inner) },
    uMid: { value: new Color(swatch.mid) },
    uOuter: { value: new Color(swatch.outer) },
    uRing: { value: new Color(swatch.ring) },
    uPupil: { value: pupilScale },
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
        uniform vec3 uInner; uniform vec3 uMid; uniform vec3 uOuter; uniform vec3 uRing; uniform float uPupil;`,
      )
      .replace(
        '#include <color_fragment>',
        `
        vec3 a3Dir = normalize(vEye);
        float a3Ang = acos(clamp(a3Dir.z, -1.0, 1.0));
        float a3Iris = 0.74;
        float a3Pupil = 0.33 * uPupil;
        float a3T = clamp((a3Ang - a3Pupil) / (a3Iris - a3Pupil), 0.0, 1.0);
        float a3Spoke = sin(atan(a3Dir.y, a3Dir.x) * 34.0) * 0.5 + 0.5;
        vec3 a3Col = mix(uInner, uMid, smoothstep(0.0, 0.55, a3T));
        a3Col = mix(a3Col, uOuter, smoothstep(0.5, 1.0, a3T));
        a3Col *= 0.9 + 0.16 * a3Spoke * (1.0 - a3T);
        a3Col = mix(a3Col, uRing, smoothstep(0.84, 1.0, a3T));
        // Soft warm shade toward the back of the white, as if the lids shadow it.
        vec3 a3White = mix(vec3(1.0), vec3(0.86, 0.8, 0.8), smoothstep(0.7, 1.5, a3Ang));
        vec3 a3Eye = mix(a3Col, a3White, smoothstep(a3Iris - 0.012, a3Iris + 0.012, a3Ang));
        a3Eye = mix(vec3(0.02, 0.015, 0.02), a3Eye, smoothstep(a3Pupil - 0.012, a3Pupil + 0.012, a3Ang));
        diffuseColor.rgb = a3Eye;
        `,
      )
  }
  material.customProgramCacheKey = () => 'avatar3d-eye'
  return material
}

export interface LookMaterials {
  palette: ShellPalette
  finish: ShellFinish
  marking: ShellMarking
  eyeColor: AvatarEyeColor
  pupilScale?: number
}

/** The full material set for one character. */
export function buildMaterials(look: LookMaterials): Record<MaterialSlot, Material> {
  const p = look.palette
  const split = SHELL_PALETTE_MAP[p.splitWith] ?? p
  return {
    shell: shellMaterial({
      base: p.base,
      shade: p.shade,
      highlight: p.highlight,
      marking: look.marking,
      markingColor: look.marking === 'stardust' ? p.highlight : p.marking,
      splitBase: split.base,
      finish: look.finish,
    }),
    belly: shellMaterial({ base: p.belly, shade: p.bellyShade, highlight: '#ffffff', finish: 'satin', grain: 0.04 }),
    brow: shellMaterial({ base: '#' + new Color(p.base).lerp(new Color(p.shade), 0.4).getHexString(), shade: p.shade, highlight: p.highlight, finish: 'satin' }),
    eye: eyeMaterial(look.eyeColor, look.pupilScale),
    mouth: new MeshStandardMaterial({ color: new Color(p.deep), roughness: 0.7 }),
  }
}

export function disposeMaterials(materials: Record<string, Material>): void {
  for (const m of Object.values(materials)) m.dispose()
}
