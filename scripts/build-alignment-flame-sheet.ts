/** Pack ImageGen keyframes into a registered loop. Source keys and prompts: chamber ASSETS.md. */
import sharp from 'sharp'
import fs from 'node:fs/promises'

const [sourceA, sourceB, output] = process.argv.slice(2)
if (!sourceA || !sourceB || !output) throw new Error('Usage: tsx scripts/build-alignment-flame-sheet.ts <a.png> <b.png> <sheet.png>')
const size = 192
const count = 32
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
const a = await load(sourceA), b = await load(sourceB)
const energy = (pixels: Buffer) => {
  let total = 0
  for (let i = 0; i < pixels.length; i += 4) {
    total += (pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722) * a[i + 3]
  }
  return total
}
const gain = energy(a) / energy(b)
const frames: Buffer[] = []
for (let frame = 0; frame < count; frame++) {
  // Periodic interpolation gives the wrap the same small delta as every other step.
  const mix = .5 * (1 - Math.cos(frame / count * Math.PI * 2))
  const pixels = Buffer.from(a)
  for (let i = 0; i < pixels.length; i += 4) {
    // Keep A's alpha exactly; feather interior changes away from the silhouette.
    const interior = Math.max(0, (a[i + 3] - 180) / 75)
    for (let c = 0; c < 3; c++) {
      const delta = Math.max(-32, Math.min(32, b[i + c] * gain - a[i + c]))
      pixels[i + c] = Math.max(0, Math.min(255, Math.round(a[i + c] + delta * mix * interior)))
    }
  }
  frames.push(await sharp({ create: { width: size, height: size, channels: 4, background: '#00000000' } })
    .composite([{ input: pixels, raw: { width, height, channels: 4 }, left: Math.floor((size - width) / 2), top: 176 - height }]).png().toBuffer())
}
await fs.writeFile(output, await sharp({ create: { width: size * 8, height: size * 4, channels: 4, background: '#00000000' } })
  .composite(frames.map((input, index) => ({ input, left: index % 8 * size, top: Math.floor(index / 8) * size }))).png().toBuffer())
console.log(`Packed ${count} frames, ${size * 8} × ${size * 4}; identical alpha and anchors in every cell.`)
