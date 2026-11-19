/**
 * Browser half of `npm run emblem:bake`. Bakes the 3D emblem's lighting once:
 *
 * - Two matcaps (a lit ball per material: the satin face and the glossy bevel), lit by the old
 *   five-light rig plus a dark studio (warm softbox upper left, cyan strip low right) for
 *   reflections. BrandIcon3D reads these instead of lighting the mesh every frame.
 * - A turntable strip: the emblem rocking through one loop, FRAMES frames side by side. GlowEmblem
 *   steps through it with CSS, so the loader, 404, sign-in and certificates show the 3D emblem
 *   without WebGL.
 *
 * Sets window.emblemBake = { cap, bevel, strip } as WebP data URLs. scripts/brand/bake-emblem-light.mjs
 * runs it in Playwright's Chromium and writes the files to public/images/emblem/.
 */
import * as THREE from 'three'
import { createBrandEmblemGeometry } from '../../src/components/ui/BrandIcon3D'
import { EMBLEM_TURNTABLE, emblemTurntablePose } from '../../src/lib/emblem-light'

const MATCAP_SIZE = 256

function darkStudio(): THREE.Scene {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x020306)
  const box = (color: number, intensity: number, w: number, h: number, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    )
    mesh.position.set(x, y, z)
    mesh.lookAt(0, 0, 0)
    scene.add(mesh)
  }
  box(0xfff0e6, 6, 3, 2, -4, 4, 4) // warm key softbox
  box(0x00c3ff, 5, 6, 0.5, 4, -2.5, -3) // cyan strip, low right
  box(0xffffff, 1.5, 8, 0.4, 0, 6, -2) // faint top strip
  return scene
}

function addRig(scene: THREE.Scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.55))
  const lights: [number, number, [number, number, number]][] = [
    [0xfff0ea, 2.1, [80, 95, 70]],
    [0xffb4a8, 1.8, [-95, 55, 45]],
    [0x00c3ff, 2.4, [90, -55, -35]],
    [0xff453a, 1.1, [-30, -90, 40]],
  ]
  for (const [color, intensity, pos] of lights) {
    const light = new THREE.DirectionalLight(color, intensity)
    light.position.set(...pos)
    scene.add(light)
  }
}

function bakeMatcap(renderer: THREE.WebGLRenderer, material: THREE.MeshStandardMaterial, envMap: THREE.Texture, envStrength: number): string {
  const scene = new THREE.Scene()
  addRig(scene)
  material.envMap = envMap
  material.envMapIntensity = envStrength
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), material))
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  camera.position.z = 5
  renderer.setSize(MATCAP_SIZE, MATCAP_SIZE, false)
  // No tone mapping here: the live renderer tone maps the matcap's colour once, as it did the lights.
  renderer.toneMapping = THREE.NoToneMapping
  renderer.setClearColor(0x000000, 1)
  renderer.render(scene, camera)
  return renderer.domElement.toDataURL('image/webp', 0.92)
}

function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        resolve(texture)
      },
      undefined,
      reject,
    )
  })
}

async function bakeStrip(renderer: THREE.WebGLRenderer, capUrl: string, bevelUrl: string): Promise<string> {
  const { frames, frameSize } = EMBLEM_TURNTABLE
  const [cap, bevel] = await Promise.all([loadTexture(capUrl), loadTexture(bevelUrl)])
  const scene = new THREE.Scene()
  const mesh = new THREE.Mesh(createBrandEmblemGeometry(), [
    new THREE.MeshMatcapMaterial({ matcap: cap }),
    new THREE.MeshMatcapMaterial({ matcap: bevel }),
  ])
  scene.add(mesh)
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 500)
  camera.position.set(0, 0, 198)
  renderer.setSize(frameSize, frameSize, false)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor(0x000000, 0)

  const strip = document.createElement('canvas')
  strip.width = frameSize * frames
  strip.height = frameSize
  const ctx = strip.getContext('2d')!
  for (let i = 0; i < frames; i++) {
    const pose = emblemTurntablePose(i / frames)
    mesh.rotation.set(pose.x, pose.y, pose.z)
    renderer.render(scene, camera)
    ctx.drawImage(renderer.domElement, i * frameSize, 0)
  }
  return strip.toDataURL('image/webp', 0.82)
}

async function run() {
  const canvas = document.createElement('canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromScene(darkStudio(), 0.03).texture

  const cap = bakeMatcap(
    renderer,
    new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xd92318, emissiveIntensity: 0.28, roughness: 0.48, metalness: 0.08 }),
    env,
    0.9,
  )
  const bevel = bakeMatcap(
    renderer,
    new THREE.MeshPhysicalMaterial({
      color: 0x9e160d,
      emissive: 0x380502,
      emissiveIntensity: 0.2,
      roughness: 0.2,
      metalness: 0.42,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
      reflectivity: 1,
    }),
    env,
    4,
  )
  const strip = await bakeStrip(renderer, cap, bevel)
  ;(window as unknown as { emblemBake: unknown }).emblemBake = { cap, bevel, strip }
}

run().catch((error) => {
  ;(window as unknown as { emblemBake: unknown }).emblemBake = { error: String(error) }
})
