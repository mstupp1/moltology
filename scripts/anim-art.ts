#!/usr/bin/env tsx
/**
 * Painted art kits for the animation sets (background plate, cut-out middle layer, textures).
 *
 *   npm run anim:art -- prompts --set codex-study          # print each prompt and where to save it
 *   npm run anim:art -- generate --set codex-study         # ask the Codex CLI to draw missing images
 *   npm run anim:art -- import --set codex-study           # fit raw images to size, seamless, transparent
 *   npm run anim:art -- sheet --set codex-study            # one contact sheet to review the kit
 *   npm run anim:art -- upload --set codex-study           # put the kit in the bucket, update manifest.json
 *
 * Any agent can make the images: save each one as PNG at the path `prompts` prints, then import.
 * `generate` is the shortcut for an agent without its own image tool (it runs `codex exec`).
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { ART_DIR, ART_SLOTS, artPrompt, bucketKey, finalPath, importArt, loadArtSpec, loadManifest, rawPath, saveManifest, sha, slotsOf, type ArtSlot } from './lib/character-animation/set-art'
import { SET_NAMES } from '../src/lib/avatar3d/sets'

interface Args {
  command: string
  sets: string[]
  only?: ArtSlot[]
  force: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { command: argv[0] ?? '', sets: [], force: false }
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--set') args.sets.push(argv[++i])
    else if (a === '--only') args.only = argv[++i].split(',') as ArtSlot[]
    else if (a === '--force') args.force = true
  }
  if (!args.sets.length || args.sets.includes('all')) args.sets = [...SET_NAMES]
  for (const s of args.sets) if (!SET_NAMES.includes(s as never)) throw new Error(`Unknown set "${s}" (${SET_NAMES.join(', ')})`)
  for (const s of args.only ?? []) if (!ART_SLOTS.includes(s)) throw new Error(`Unknown slot "${s}" (${ART_SLOTS.join(', ')})`)
  return args
}

const spec = loadArtSpec()
const pick = (set: string, only?: ArtSlot[]) => slotsOf(spec, set).filter((s) => !only || only.includes(s))

function generate(set: string, slot: ArtSlot) {
  const out = rawPath(set, slot)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  const task = [
    'Generate exactly one image with your built-in image generation tool and save it as a PNG file at this exact path:',
    out,
    'Do not read any repository files or documentation first; everything you need is in this message. Do not edit any other file.',
    'Image description:',
    artPrompt(spec, set, slot),
  ].join('\n')
  const bin = process.env.CODEX_BIN ?? 'codex'
  const started = Date.now()
  console.log(`🎨 ${set}/${slot}: asking Codex...`)
  execFileSync(bin, ['exec', '--skip-git-repo-check', '-s', 'workspace-write', task], { stdio: ['ignore', 'ignore', 'inherit'], cwd: process.cwd() })
  if (!fs.existsSync(out)) throw new Error(`Codex finished but ${out} is missing`)
  console.log(`   saved ${path.relative(process.cwd(), out)} in ${((Date.now() - started) / 1000).toFixed(0)}s`)
}

/** All of a set's imported art on one sheet, textures shown tiled 2×2 so seams would show. */
async function sheet(set: string): Promise<string> {
  const slots = slotsOf(spec, set).filter((s) => fs.existsSync(finalPath(set, s)))
  const cell = 360
  const canvas = createCanvas(cell * slots.length, Math.round(cell * 16 / 9) + 40)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#7a7f86' // mid grey so transparent edges show
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.font = '22px sans-serif'
  for (const [i, slot] of slots.entries()) {
    const image = await loadImage(fs.readFileSync(finalPath(set, slot)))
    const x = i * cell
    if (spec.slots[slot].tile) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) ctx.drawImage(image, x + (dx * cell) / 2, 40 + (dy * cell) / 2, cell / 2, cell / 2)
    else ctx.drawImage(image, x, 40, cell, (cell * image.height) / image.width)
    ctx.fillStyle = '#fff'
    ctx.fillText(slot, x + 10, 28)
  }
  const out = path.join(ART_DIR, set, 'sheet.jpg')
  fs.writeFileSync(out, canvas.toBuffer('image/jpeg', 85))
  return out
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!['prompts', 'generate', 'import', 'sheet', 'upload'].includes(args.command)) {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(2, 15).join('\n'))
    process.exit(args.command ? 1 : 0)
  }
  for (const set of args.sets) {
    const slots = pick(set, args.only)
    if (args.command === 'prompts') {
      for (const slot of slots) console.log(`\n## ${set} / ${slot}\nSave as: ${path.relative(process.cwd(), rawPath(set, slot))}\n\n${artPrompt(spec, set, slot)}`)
    } else if (args.command === 'generate') {
      for (const slot of slots) if (args.force || !fs.existsSync(rawPath(set, slot))) generate(set, slot)
    } else if (args.command === 'import') {
      for (const slot of slots) {
        if (!fs.existsSync(rawPath(set, slot))) {
          console.log(`   ${set}/${slot}: no raw image yet`)
          continue
        }
        console.log(`   ${set}/${slot} → ${path.relative(process.cwd(), await importArt(spec, set, slot))}`)
      }
      console.log(`🖼️  ${path.relative(process.cwd(), await sheet(set))}`)
    } else if (args.command === 'sheet') {
      console.log(`🖼️  ${path.relative(process.cwd(), await sheet(set))}`)
    } else if (args.command === 'upload') {
      const { uploadLocalFileToS3 } = await import('../src/lib/ingest/s3-upload')
      const manifest = loadManifest()
      manifest[set] ??= {}
      for (const slot of slots) {
        const file = finalPath(set, slot)
        if (!fs.existsSync(file)) continue
        const key = bucketKey(set, slot)
        await uploadLocalFileToS3(file, key)
        manifest[set]![slot] = { key, sha: sha(file) }
        console.log(`☁️  ${key}`)
      }
      saveManifest(manifest)
      console.log('   content/animation/sets/manifest.json updated (commit it)')
    }
  }
}

main().catch((err) => {
  console.error(`❌ ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
