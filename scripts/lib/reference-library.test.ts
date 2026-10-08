import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createCanvas } from '@napi-rs/canvas'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  detectImageType,
  ingestInbox,
  loadReferences,
  nearestCompositeAspect,
  summarizeLibrary,
  titleFromFilename,
} from './reference-library'

async function writePng(file: string, width: number, height: number, color: string) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#ff453a'
  ctx.fillRect(0, 0, width / 4, height / 4)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, await canvas.encode('png'))
}

describe('reference library helpers', () => {
  it('sniffs image types from bytes, not names', () => {
    expect(detectImageType(Buffer.from('89504e470d0a1a0a0000000d', 'hex'))).toBe('png')
    expect(detectImageType(Buffer.from('ffd8ffe000104a4649460001', 'hex'))).toBe('jpg')
    expect(detectImageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'binary'))).toBe('webp')
    expect(detectImageType(Buffer.from('%PDF-1.7 hello world', 'binary'))).toBeNull()
  })

  it('maps sizes to the nearest composite canvas', () => {
    expect(nearestCompositeAspect(1080, 1350)).toBe('4:5')
    expect(nearestCompositeAspect(1200, 1600)).toBe('3:4')
    expect(nearestCompositeAspect(1080, 1920)).toBe('9:16')
    expect(nearestCompositeAspect(1200, 628)).toBe('16:9')
    expect(nearestCompositeAspect(500, 500)).toBe('1:1')
  })

  it('turns file names into titles', () => {
    expect(titleFromFilename('nike_air-max_ad.png')).toBe('Nike air max ad')
    expect(titleFromFilename('.png')).toBe('Untitled reference')
  })
})

describe('ingestInbox', () => {
  let root: string
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'refs-'))
  })
  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('ingests images with tags and notes, dedupes, and skips non-images', async () => {
    const inbox = path.join(root, 'inbox')
    await writePng(path.join(inbox, 'ads', 'fitness', 'big-stat.png'), 1080, 1350, '#021324')
    fs.writeFileSync(path.join(inbox, 'ads', 'fitness', 'big-stat.txt'), 'Love the giant number.')
    await writePng(path.join(inbox, 'upload-without-extension'), 1080, 1920, '#203040')
    fs.writeFileSync(path.join(inbox, 'brief.pdf'), '%PDF-1.7 not an image at all')

    const first = await ingestInbox(root)
    expect(first.added).toHaveLength(2)
    expect(first.skipped).toEqual([{ file: 'brief.pdf', reason: expect.stringContaining('not a PNG') }])

    const stat = first.added.find((r) => r.originalName.endsWith('big-stat.png'))!
    expect(stat.tags).toEqual(['ads', 'fitness'])
    expect(stat.notes).toBe('Love the giant number.')
    expect(stat.nearestAspect).toBe('4:5')
    expect(stat.status).toBe('new')
    expect(stat.palette[0].hex).toBe('#021324')
    expect(fs.existsSync(path.join(root, 'library', stat.id, 'preview.jpg'))).toBe(true)
    expect(fs.existsSync(path.join(inbox, 'ads', 'fitness', 'big-stat.png'))).toBe(false)

    const noExt = first.added.find((r) => r.originalName === 'upload-without-extension')!
    expect(noExt.sourceFile).toBe('source.png')
    expect(noExt.nearestAspect).toBe('9:16')

    await writePng(path.join(inbox, 'same-again.png'), 1080, 1350, '#021324')
    const second = await ingestInbox(root)
    expect(second.added).toHaveLength(0)
    expect(second.duplicates).toEqual([{ file: 'same-again.png', id: stat.id }])

    const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'))
    expect(index.references).toHaveLength(2)
    const summary = summarizeLibrary(loadReferences(root))
    expect(summary.byStatus).toEqual({ new: 2 })
    expect(summary.topTags).toEqual([
      ['ads', 1],
      ['fitness', 1],
    ])
  })
})
