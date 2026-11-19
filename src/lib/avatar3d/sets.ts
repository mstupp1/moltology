/**
 * Sets for scripted animation. A set is a painted background card at the back of the 3D scene plus
 * the surface the cast stands on (a floor disc that fades into the painting, a rug in the study),
 * so the characters cast shadows onto something and the camera moves past the floor, the cast and
 * the painting together. Nothing stands in front of the cast. Without painted art the set falls
 * back to plain colours and the compositor's drawn backdrop.
 */
import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three'

export const SET_NAMES = ['codex-study', 'reef-office', 'open-water'] as const
export type SetName = (typeof SET_NAMES)[number]

/** Painted art for a set (image URLs, usually data URLs). Any missing slot keeps the plain look. */
export type SetArt = Partial<Record<'plate' | 'floor' | 'rug', string>>

export interface BuiltSet {
  root: Group
  /** Gentle motion (lamp flicker) at time t in seconds. */
  update: (t: number) => void
  /** Resolves once every art texture has loaded, so the first frame already shows it. */
  ready: Promise<void>
}

/**
 * The painted card: 9:16, far enough back that it covers the frame in the widest two-shot (with
 * room for the hook's raised framing) and in close shots panned to either side.
 */
export const PLATE = { z: -5, width: 7, centreY: 1.0 }

const SETS: Record<SetName, { floor: string; rug?: string; lamp?: [number, number, number] }> = {
  'codex-study': { floor: '#5a3f2c', rug: '#6e2f2b', lamp: [1.6, 1.4, -2.6] },
  'reef-office': { floor: '#c9bfa8' },
  'open-water': { floor: '#8a7a5c' },
}

/** Loads art textures and puts them on materials once they arrive. */
function artLoader(art: SetArt) {
  const loader = new TextureLoader()
  const pending: Promise<void>[] = []
  return {
    pending,
    apply(slot: keyof SetArt, material: MeshStandardMaterial | MeshBasicMaterial, repeat = 1) {
      const url = art[slot]
      if (!url) return false
      pending.push(
        loader.loadAsync(url).then((texture: Texture) => {
          texture.colorSpace = SRGBColorSpace
          if (repeat !== 1) {
            texture.wrapS = texture.wrapT = RepeatWrapping
            texture.repeat.set(repeat, repeat)
          }
          texture.anisotropy = 8
          material.map = texture
          material.color.set('#ffffff')
          material.needsUpdate = true
        })
      )
      return true
    },
  }
}

function radial(size: number, stops: [number, string][]): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  for (const [at, color] of stops) g.addColorStop(at, color)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return canvas
}

/** A floor disc that fades out at the edge, so it melts into the painting behind it. */
function floor(color: string, paint: ReturnType<typeof artLoader>, radius = 3.2): Mesh {
  const c = new Color(color)
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`
  const tint = new CanvasTexture(radial(256, [[0, `rgba(${rgb},1)`], [0.55, `rgba(${rgb},0.85)`], [1, `rgba(${rgb},0)`]]))
  tint.colorSpace = SRGBColorSpace
  const material = new MeshStandardMaterial({ map: tint, transparent: true, roughness: 0.95, depthWrite: false })
  // With painted boards or sand the fade moves to an alpha map (which reads brightness) and the
  // art tiles across the disc.
  if (paint.apply('floor', material, 3)) material.alphaMap = new CanvasTexture(radial(256, [[0, '#fff'], [0.5, '#e0e0e0'], [1, '#000']]))
  const mesh = new Mesh(new CircleGeometry(radius, 48), material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.0005
  mesh.receiveShadow = true
  mesh.renderOrder = -2
  return mesh
}

/** The painted background as a card at the back of the scene, unlit so it keeps its own light. */
function plateCard(paint: ReturnType<typeof artLoader>): Mesh | null {
  const material = new MeshBasicMaterial({ toneMapped: false, depthWrite: false })
  if (!paint.apply('plate', material)) return null
  const height = PLATE.width * (16 / 9)
  const mesh = new Mesh(new PlaneGeometry(PLATE.width, height), material)
  mesh.position.set(0, PLATE.centreY, PLATE.z)
  mesh.renderOrder = -4
  return mesh
}

/** A few books lying on the floor, off to the side of the cast. */
function books(x: number, z: number): Group {
  const g = new Group()
  const colors = ['#7a2e2a', '#2f4f6e', '#6b5a2a', '#3d5c3a']
  colors.forEach((color, i) => {
    const b = new Mesh(new BoxGeometry(0.42 - i * 0.03, 0.07, 0.3), new MeshStandardMaterial({ color, roughness: 0.8 }))
    b.position.set(x + (i % 2) * 0.02, 0.035 + i * 0.072, z)
    b.rotation.y = (i - 1.5) * 0.12
    b.castShadow = b.receiveShadow = true
    g.add(b)
  })
  return g
}

export function buildSet(name: SetName, art: SetArt = {}): BuiltSet {
  const spec = SETS[name]
  const root = new Group()
  const paint = artLoader(art)
  const card = plateCard(paint)
  if (card) root.add(card)
  root.add(floor(spec.floor, paint))
  if (spec.rug) {
    const rugMat = new MeshStandardMaterial({ color: spec.rug, roughness: 0.95 })
    paint.apply('rug', rugMat)
    const rug = new Mesh(new CircleGeometry(1.5, 48), rugMat)
    rug.rotation.x = -Math.PI / 2
    rug.position.y = 0.001
    rug.receiveShadow = true
    root.add(rug)
  }
  if (name === 'codex-study') root.add(books(-1.25, -1.3), books(-1.0, -1.7))
  // A warm light where the painting's lamp glows, so the cast catches it too.
  let flicker: PointLight | null = null
  if (spec.lamp) {
    flicker = new PointLight('#ffc874', 2.2, 4.5, 1.6)
    flicker.position.set(...spec.lamp)
    root.add(flicker)
  }
  return {
    root,
    ready: Promise.all(paint.pending).then(() => undefined),
    update(t) {
      if (flicker) flicker.intensity = 2.2 + Math.sin(t * 7.3) * 0.05 + Math.sin(t * 2.1) * 0.05
    },
  }
}
