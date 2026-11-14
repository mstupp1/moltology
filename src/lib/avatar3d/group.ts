/**
 * The forum's group photo: every member's character standing together on steps, drawn once in
 * one scene and saved as an image. Nothing here runs on its own: the forum asks for a photo only
 * when the stored one is due to be retaken (see src/lib/community-photo.ts).
 */
import {
  Box3,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  CanvasTexture,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { groupLayout, photoPose, type CommunityPhotoSpot } from '../community-photo'
import type { LobsterAvatarConfig } from '../lobster-avatar'
import { buildCharacter, type Character3D } from './character'
import { withLoftDetail } from './loft'
import { lookFromConfig } from './look'
import { Avatar3DUnavailable } from './portraits'

export interface GroupMember {
  id: string
  config: LobsterAvatarConfig
}

export interface GroupPhoto {
  /** The photo as a data URL: WebP where the browser can write it, otherwise PNG. */
  image: string
  spots: CommunityPhotoSpot[]
}

function contactShadow(): CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(0,0,0,0.5)')
  g.addColorStop(0.5, 'rgba(0,0,0,0.22)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(canvas)
}

/** Let the page breathe between characters, so building a large group never freezes it. */
const breathe = () =>
  new Promise<void>((next) => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(() => next(), { timeout: 200 })
    else setTimeout(next, 16)
  })

/**
 * Draw the group photo at `width`×`height`. Members stand in the order given, the first in the
 * front row. Returns the image and where each member's head landed in it.
 */
export async function renderGroupPhoto(members: readonly GroupMember[], width: number, height: number, signal?: AbortSignal): Promise<GroupPhoto | null> {
  if (!members.length) return null
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
  } catch (cause) {
    throw new Avatar3DUnavailable(cause)
  }
  const built: Character3D[] = []
  const disposables: { dispose: () => void }[] = []
  try {
    renderer.setPixelRatio(1)
    renderer.setSize(width, height, false)
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = NeutralToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFShadowMap
    renderer.setClearColor(0x000000, 0)

    const scene = new Scene()
    const pmrem = new PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const env = pmrem.fromScene(room, 0.04)
    disposables.push(pmrem, room, env)
    scene.environment = env.texture
    scene.environmentIntensity = 0.28

    const layout = groupLayout(members.length)
    const across = Math.max(...layout.map((p) => Math.abs(p.x))) + 1.6
    const deep = Math.max(...layout.map((p) => -p.z)) + 1.6

    // The same studio light as single portraits: warm key from the front right, cool fill, a rim.
    const hemi = new HemisphereLight(0xfff1e6, 0x5a3038, 0.45)
    const key = new DirectionalLight(0xfff4e8, 3.1)
    key.position.set(across * 0.5 + 2, 6, 7)
    key.target.position.set(0, 1, -deep / 2)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = key.shadow.camera.bottom = -Math.max(across, deep) - 1
    key.shadow.camera.right = key.shadow.camera.top = Math.max(across, deep) + 1
    key.shadow.camera.near = 1
    key.shadow.camera.far = 30
    key.shadow.bias = -0.0005
    key.shadow.normalBias = 0.02
    const fill = new DirectionalLight(0xa9c9ff, 0.55)
    fill.position.set(-across - 2, 2, 3)
    const rim = new DirectionalLight(0xc8ecff, 1.8)
    rim.position.set(-2, 3, -deep - 4)
    scene.add(hemi, key, key.target, fill, rim)

    // Each row stands on its own step: a surface that only shows the shadows cast on it.
    const rows = Math.max(...layout.map((p) => p.row)) + 1
    const blob = contactShadow()
    disposables.push(blob)
    for (let row = 0; row < rows; row++) {
      const sample = layout.find((p) => p.row === row)!
      const plane = new PlaneGeometry(across * 2 + 4, 1.4)
      const mat = new ShadowMaterial({ opacity: 0.24 })
      disposables.push(plane, mat)
      const step = new Mesh(plane, mat)
      step.rotation.x = -Math.PI / 2
      step.position.set(0, sample.y, sample.z)
      step.receiveShadow = true
      scene.add(step)
    }

    const blobGeo = new PlaneGeometry(1.5, 1)
    const blobMat = new MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false, opacity: 0.6 })
    disposables.push(blobGeo, blobMat)
    const spots: { id: string; at: Vector3; size: number }[] = []
    for (let i = 0; i < members.length; i++) {
      if (signal?.aborted) return null
      const member = members[i]
      const place = layout[i]
      const look = { ...lookFromConfig(member.config), pose: photoPose(member.id), temperament: undefined }
      const character = withLoftDetail(0.8, () => buildCharacter(look))
      built.push(character)
      character.setPose(look.pose, true)
      character.update(0.016, 0, false)
      character.root.traverse((o) => {
        if ((o as Mesh).isMesh) o.castShadow = true
      })
      // Everyone turns a little toward the middle of the group, as people do in a photo.
      const holder = new Group()
      holder.position.set(place.x, place.y, place.z)
      holder.rotation.y = -place.x * 0.05
      holder.add(character.root)
      const shadow = new Mesh(blobGeo, blobMat)
      shadow.rotation.x = -Math.PI / 2
      shadow.position.set(place.x, place.y + 0.003, place.z)
      scene.add(holder, shadow)
      spots.push({ id: member.id, at: new Vector3(place.x, place.y + character.portrait.y, place.z), size: character.portrait.size })
      await breathe()
    }

    // Frame the whole group, looking down a little so the back rows show over the front.
    scene.updateMatrixWorld(true)
    const box = new Box3()
    for (const c of built) box.expandByObject(c.root)
    const centre = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    const camera = new PerspectiveCamera(24, width / height, 0.1, 100)
    const vfov = (camera.fov * Math.PI) / 180
    const distTall = (size.y * 1.08) / 2 / Math.tan(vfov / 2)
    const distWide = (size.x * 1.06) / 2 / (Math.tan(vfov / 2) * camera.aspect)
    const dist = Math.max(distTall, distWide) + size.z / 2
    camera.position.set(centre.x, centre.y + dist * 0.24, centre.z + dist)
    camera.lookAt(centre.x, centre.y - size.y * 0.02, centre.z)
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld(true)

    renderer.render(scene, camera)
    let image = canvas.toDataURL('image/webp', 0.86)
    if (!image.startsWith('data:image/webp')) image = canvas.toDataURL('image/png')

    const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
    const edge = new Vector3()
    const out: CommunityPhotoSpot[] = spots.map(({ id, at, size: headSize }) => {
      const p = at.clone().project(camera)
      edge.copy(at).add(new Vector3(headSize * 0.42, 0, 0)).project(camera)
      return {
        id,
        x: clamp01((p.x + 1) / 2),
        y: clamp01((1 - p.y) / 2),
        r: clamp01(Math.abs(edge.x - p.x) / 2),
      }
    })
    return { image, spots: out }
  } finally {
    for (const c of built) c.dispose()
    for (const d of disposables) d.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }
}
