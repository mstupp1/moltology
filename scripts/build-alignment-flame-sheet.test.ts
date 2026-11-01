import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

describe('alignment flame production packer', () => {
  it('rejects motion that disappears at socket size and packs distinct poses with fixed alpha', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'alignment-flame-'))
    try {
      const sources: string[] = []
      for (const band of [24, 30, 36]) {
        const pixels = Buffer.alloc(64 * 64 * 4)
        for (let y = 8; y < 58; y++) for (let x = 22; x < 42; x++) {
          const i = (y * 64 + x) * 4
          pixels[i + 1] = x >= band && x < band + 3 ? 210 : 30
          pixels[i + 2] = x >= band && x < band + 3 ? 240 : 40
          pixels[i + 3] = 255
        }
        const file = path.join(dir, `${band}.png`)
        await sharp(pixels, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(file)
        sources.push(file)
      }
      const output = path.join(dir, 'sheet.png')
      const run = (inputs: string[]) => execFileSync(process.execPath,
        ['--import', 'tsx', 'scripts/build-alignment-flame-sheet.ts', ...inputs, output], { stdio: 'pipe' })
      expect(() => run([sources[0], sources[0]])).toThrow(/motion is unreadable/)
      await expect(access(output)).rejects.toThrow()
      run(sources)
      const metadata = await sharp(output).metadata()
      expect([metadata.width, metadata.height]).toEqual([1536, 1152])
      let reference: Buffer | undefined
      for (let frame = 0; frame < 48; frame++) {
        const alpha = await sharp(output).extract({ left: frame % 8 * 192, top: Math.floor(frame / 8) * 192, width: 192, height: 192 })
          .extractChannel('alpha').raw().toBuffer()
        if (!reference) reference = alpha
        expect(alpha.equals(reference)).toBe(true)
      }
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
