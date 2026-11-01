/** Pack ImageGen keyframes into a registered loop. Source keys and prompts: chamber ASSETS.md. */
import sharp from 'sharp'
import fs from 'node:fs/promises'

const args = process.argv.slice(2)
const output = args.pop()
const [sourceA] = args
if (args.length < 2 || !output) throw new Error('Usage: tsx scripts/build-alignment-flame-sheet.ts <a.png> <b.png> [c.png ...] <sheet.png>')
const size = 192
const count = args.length * 16
const original = await sharp(sourceA).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
let left = original.info.width, top = original.info.height, right = 0, bottom = 0
for (let y = 0; y < original.info.height; y++) {
  for (let x = 0; x < original.info.width; x++) {
    if (original.data[(y * original.info.width + x) * 4 + 3] > 8) {
      left = Math.min(left, x); right = Math.max(right, x)
      top = Math.min(top, y); bottom = Math.max(bottom, y)
    }
  }
}
const crop = { left, top, width: right - left + 1, height: bottom - top + 1 }
const height = 144
const width = Math.round(crop.width * height / crop.height)
const load = async (file: string) => sharp(file).ensureAlpha().extract(crop)
  .resize(width, height).raw().toBuffer()
const sources = await Promise.all(args.map(load))
const a = sources[0]
const energy = (pixels: Buffer) => {
  let total = 0
  for (let i = 0; i < pixels.length; i += 4) {
    total += (pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722) * a[i + 3]
  }
  return total
}
const targetEnergy = energy(a)
const gains = sources.map((pixels) => targetEnergy / energy(pixels))
const frames: Buffer[] = []
for (let frame = 0; frame < count; frame++) {
  // Three distinct poses carry a readable current around the loop, including C → A.
  const pose = Math.floor(frame / 16)
  const next = (pose + 1) % sources.length
  const mix = .5 * (1 - Math.cos(frame % 16 / 16 * Math.PI))
  const pixels = Buffer.from(a)
  for (let i = 0; i < pixels.length; i += 4) {
    // Keep A's alpha exactly; feather interior changes away from the silhouette.
    const interior = Math.max(0, (a[i + 3] - 180) / 75)
    for (let c = 0; c < 3; c++) {
      const current = sources[pose][i + c] * gains[pose]
      const following = sources[next][i + c] * gains[next]
      const value = a[i + c] * (1 - interior) + (current * (1 - mix) + following * mix) * interior
      pixels[i + c] = Math.max(0, Math.min(255, Math.round(value)))
    }
  }
  // Keep light energy steady without suppressing visible local ribbon movement.
  for (let pass = 0; pass < 3; pass++) {
    const gain = targetEnergy / energy(pixels)
    for (let i = 0; i < pixels.length; i += 4) {
      for (let c = 0; c < 3; c++) pixels[i + c] = Math.max(0, Math.min(255, Math.round(pixels[i + c] * gain)))
    }
  }
  frames.push(await sharp({ create: { width: size, height: size, channels: 4, background: '#00000000' } })
    .composite([{ input: pixels, raw: { width, height, channels: 4 }, left: Math.floor((size - width) / 2), top: 176 - height }]).png().toBuffer())
}
// Do not ship another loop whose frames differ only when enlarged. At phone socket
// size, at least 5% of opaque pixels must visibly change between each generated pose.
const previews = await Promise.all(frames.filter((_, index) => index % 16 === 0)
  .map((frame) => sharp(frame).resize(42, 42).raw().toBuffer()))
previews.forEach((current, index) => {
  const next = previews[(index + 1) % previews.length]
  let visible = 0, changed = 0
  for (let i = 0; i < current.length; i += 4) {
    if (current[i + 3] <= 180) continue
    visible++
    if ([0, 1, 2].some((c) => Math.abs(current[i + c] - next[i + c]) >= 20)) changed++
  }
  if (!visible || changed / visible < .05) throw new Error(`Pose ${index}: motion is unreadable at 42px socket size`)
})
await fs.writeFile(output, await sharp({ create: { width: size * 8, height: size * Math.ceil(count / 8), channels: 4, background: '#00000000' } })
  .composite(frames.map((input, index) => ({ input, left: index % 8 * size, top: Math.floor(index / 8) * size }))).png().toBuffer())
console.log(`Packed ${count} frames, ${size * 8} × ${size * Math.ceil(count / 8)}; identical alpha and anchors in every cell.`)
