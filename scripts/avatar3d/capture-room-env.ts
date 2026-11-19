/**
 * Captures three.js's RoomEnvironment as a small equirectangular radiance map and prints it as an
 * RGBE base64 string for src/lib/avatar3d/room-env.ts. The stage builds its baked studio light from
 * that capture, so it no longer renders the room (and compiles its lit materials) on every load.
 *
 * Run in a browser page with WebGL2 (it sets window.roomEnv to the string), e.g. bundle with
 * esbuild and load it in Playwright's Chromium with --use-angle=swiftshader.
 */
import { CubeCamera, FloatType, HalfFloatType, LinearSRGBColorSpace, Mesh, NoToneMapping, PlaneGeometry, Scene, ShaderMaterial, OrthographicCamera, WebGLCubeRenderTarget, WebGLRenderer, WebGLRenderTarget } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const WIDTH = 64
const HEIGHT = 32

function capture(): string {
  const renderer = new WebGLRenderer()
  renderer.toneMapping = NoToneMapping
  renderer.outputColorSpace = LinearSRGBColorSpace
  const cube = new WebGLCubeRenderTarget(128, { type: HalfFloatType })
  const camera = new CubeCamera(0.1, 100, cube)
  camera.update(renderer, new RoomEnvironment())
  const target = new WebGLRenderTarget(WIDTH, HEIGHT, { type: FloatType })
  const flat = new Scene()
  flat.add(
    new Mesh(
      new PlaneGeometry(2, 2),
      new ShaderMaterial({
        uniforms: { cube: { value: cube.texture } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        // Same layout as stage-light.ts reads: u runs round from +x towards +z, v from straight down to straight up.
        fragmentShader: `uniform samplerCube cube; varying vec2 vUv;
          void main() {
            float phi = vUv.x * 6.2831853; float theta = (vUv.y - 0.5) * 3.1415927;
            vec3 d = vec3(cos(theta) * cos(phi), sin(theta), cos(theta) * sin(phi));
            gl_FragColor = vec4(textureCube(cube, vec3(-d.x, d.y, d.z)).rgb, 1.0);
          }`,
      }),
    ),
  )
  renderer.setRenderTarget(target)
  renderer.render(flat, new OrthographicCamera())
  const pixels = new Float32Array(WIDTH * HEIGHT * 4)
  renderer.readRenderTargetPixels(target, 0, 0, WIDTH, HEIGHT, pixels)
  const bytes = new Uint8Array(WIDTH * HEIGHT * 4)
  for (let i = 0; i < WIDTH * HEIGHT; i++) {
    const [r, g, b] = [pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2]]
    const m = Math.max(r, g, b)
    if (m < 1e-6) continue
    const e = Math.ceil(Math.log2(m))
    const s = 255 / Math.pow(2, e)
    bytes.set([Math.min(255, Math.round(r * s)), Math.min(255, Math.round(g * s)), Math.min(255, Math.round(b * s)), e + 128], i * 4)
  }
  let text = ''
  for (const byte of bytes) text += String.fromCharCode(byte)
  return btoa(text)
}

;(window as unknown as { roomEnv: string }).roomEnv = capture()
