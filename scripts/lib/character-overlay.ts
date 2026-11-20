import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { S3_BASE_URL } from '../../src/lib/assets'
import { DEFAULT_MASCOT_KEY, MASCOT_CAST, MASCOT_S3_PREFIX, resolveMascotAlias } from '../../src/lib/mascots'
import { castMember, castStillFilename, splitPose } from '../../src/lib/cast'

export type CharacterKey = 'random' | 'none' | (string & {})

export interface CharacterInfo {
  key: string
  filename: string
  s3Path: string
  publicUrl: string
  description?: string
}

const characterInfo = (key: string, filename: string, description?: string): CharacterInfo => ({
  key,
  filename,
  s3Path: `${MASCOT_S3_PREFIX}/${filename}`,
  publicUrl: `${S3_BASE_URL}/${MASCOT_S3_PREFIX}/${filename}`,
  description,
})

export const CHARACTER_REGISTRY: Record<string, CharacterInfo> = Object.fromEntries(
  MASCOT_CAST.map((m) => [m.key, characterInfo(m.key, m.filename, m.description)])
)

/**
 * Get a list of all registered character keys
 */
export function getAllCharacterKeys(): CharacterKey[] {
  return Object.keys(CHARACTER_REGISTRY) as CharacterKey[]
}

/**
 * Pick a random registered character key, optionally excluding certain keys
 */
export function getRandomCharacterKey(excludeKeys: string[] = []): CharacterKey {
  const excluded = new Set(excludeKeys.map(resolveMascotAlias))
  const pool = getAllCharacterKeys().filter((k) => !excluded.has(k))
  const candidates = pool.length > 0 ? pool : getAllCharacterKeys()
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/**
 * Generate a rotation of unique random character keys (e.g. for multi-slide carousels)
 */
export function getRandomCharacterRotation(count: number): CharacterKey[] {
  const pool = [...getAllCharacterKeys()]
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  if (count <= pool.length) {
    return pool.slice(0, count)
  }
  const result: CharacterKey[] = []
  for (let i = 0; i < count; i++) {
    result.push(pool[i % pool.length])
  }
  return result
}

/**
 * Resolve character metadata dynamically from key or filename
 */
export function getCharacterInfo(characterKeyOrFilename: string): CharacterInfo {
  const raw = characterKeyOrFilename.trim()
  if (raw === 'random' || raw === 'dice' || raw === 'shuffle') {
    return CHARACTER_REGISTRY[getRandomCharacterKey()]
  }
  const normKey = resolveMascotAlias(raw)

  if (CHARACTER_REGISTRY[normKey]) {
    const { pose } = splitPose(raw)
    const member = pose ? castMember(normKey) : undefined
    return member ? characterInfo(normKey, castStillFilename(member, pose), member.description) : CHARACTER_REGISTRY[normKey]
  }

  // Dynamic S3 fallback for any character file in images/characters/
  return characterInfo(normKey, `char_${normKey}.png`)
}

/**
 * A cast member's 3D still (`key` or `key:pose`): one already drawn in tmp/cast, else the
 * published one in the bucket, else drawn now with the 3D character code (`npm run cast:render`).
 */
async function loadCastStill(characterKey: string): Promise<any | undefined> {
  const { pose: asked } = splitPose(characterKey)
  const member = castMember(resolveMascotAlias(characterKey))
  // Unit tests never start a browser (the renderer bundles with esbuild, which jsdom breaks).
  if (!member || process.env.VITEST) return undefined
  const pose = asked ?? member.pose
  const { stillPath, renderCastStills } = await import('./cast-stills')
  const local = stillPath({ member, shot: 'full', pose })
  if (fs.existsSync(local)) return loadImage(local)
  try {
    const res = await fetch(`${S3_BASE_URL}/${MASCOT_S3_PREFIX}/${castStillFilename(member, pose)}`)
    if (res.ok) return loadImage(Buffer.from(await res.arrayBuffer()))
  } catch {
    // Not published or offline: draw it.
  }
  if (process.env.CAST_RENDER === '0') return undefined
  console.log(`Drawing ${member.name} (${pose}) with the 3D character code...`)
  const [file] = await renderCastStills([{ member, shot: 'full', pose }])
  return loadImage(file)
}

/**
 * Load a character image: a cast member's 3D still, or an older cutout from the local folders
 * or the Neon S3 bucket.
 */
export async function loadCharacterImage(characterKey: CharacterKey | string): Promise<any> {
  const still = await loadCastStill(String(characterKey))
  if (still) return still
  const info = getCharacterInfo(characterKey)
  const baseName = info.filename.replace(/\.[^/.]+$/, '')
  const candidates = [`${baseName}.webp`, `${baseName}.png`]

  for (const fn of candidates) {
    const localPath = path.resolve(process.cwd(), 'public/images/characters', fn)
    if (fs.existsSync(localPath)) {
      return await loadImage(localPath)
    }

    const scratchPath = path.resolve(process.cwd(), 'scratch/character_refs', fn)
    if (fs.existsSync(scratchPath)) {
      return await loadImage(scratchPath)
    }
  }

  // Fetch from Neon S3 public assets bucket (try webp first, then configured publicUrl)
  const s3Candidates = [
    `${S3_BASE_URL}/images/characters/${baseName}.webp`,
    info.publicUrl,
  ]

  for (const url of s3Candidates) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer()
        return await loadImage(Buffer.from(arrayBuffer))
      }
    } catch (err) {
      // Continue to next candidate
    }
  }

  console.warn(`⚠️ Failed to fetch character from S3 (${info.publicUrl})`)
  return null
}

export interface OverlayOptions {
  character: CharacterKey | string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'top-right-peek' | 'center-right'
  scalePercent?: number // Size as percentage of canvas width (e.g. 30 = 30%)
  offsetX?: number
  offsetY?: number
  rotationDegrees?: number
}

/**
 * Stamp / Composite a cartoon character cutout onto any base image
 */
export async function overlayCharacterOnImage(
  inputImagePath: string,
  outputImagePath: string,
  options: OverlayOptions
): Promise<string> {
  if (!fs.existsSync(inputImagePath)) {
    throw new Error(`Input image does not exist: ${inputImagePath}`)
  }

  const baseImg = await loadImage(inputImagePath)
  const canvas = createCanvas(baseImg.width, baseImg.height)
  const ctx = canvas.getContext('2d')

  // 1. Draw base image
  ctx.drawImage(baseImg, 0, 0, baseImg.width, baseImg.height)

  // 2. Load character cutout
  const charImg = await loadCharacterImage(options.character)
  if (!charImg) {
    console.warn(`Could not load character: ${options.character}, writing unmodified image.`)
    fs.writeFileSync(outputImagePath, canvas.toBuffer('image/jpeg'))
    return outputImagePath
  }

  // 3. Compute dimensions (default 32% scale for strong visual presence and clarity)
  const scale = (options.scalePercent || 32) / 100
  const charW = baseImg.width * scale
  const charH = (charW / charImg.width) * charImg.height

  let posX = baseImg.width - charW - 40
  let posY = baseImg.height - charH - 40

  const pos = options.position || 'bottom-right'
  if (pos === 'bottom-left') {
    posX = 40
    posY = baseImg.height - charH - 40
  } else if (pos === 'top-right') {
    posX = baseImg.width - charW - 40
    posY = 40
  } else if (pos === 'top-left') {
    posX = 40
    posY = 40
  } else if (pos === 'top-right-peek') {
    posX = baseImg.width - charW - 20
    posY = -charH * 0.15
  } else if (pos === 'center-right') {
    posX = baseImg.width - charW - 20
    posY = (baseImg.height - charH) / 2
  }

  posX += options.offsetX || 0
  posY += options.offsetY || 0

  // 4. Draw character with natural ambient contact shadow
  ctx.save()
  if (options.rotationDegrees) {
    ctx.translate(posX + charW / 2, posY + charH / 2)
    ctx.rotate((options.rotationDegrees * Math.PI) / 180)
    ctx.translate(-(posX + charW / 2), -(posY + charH / 2))
  }

  ctx.shadowColor = 'rgba(0, 0, 0, 0.80)'
  ctx.shadowBlur = 20
  ctx.drawImage(charImg, posX, posY, charW, charH)
  ctx.restore()

  const outDir = path.dirname(outputImagePath)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const isPng = outputImagePath.endsWith('.png')
  fs.writeFileSync(outputImagePath, isPng ? canvas.toBuffer('image/png') : canvas.toBuffer('image/jpeg'))
  return outputImagePath
}

/**
 * Normalize any alias, casing, or variation to standard mascot key
 */
export function normalizeMascotKey(rawKey?: string): string {
  if (!rawKey) return DEFAULT_MASCOT_KEY
  return resolveMascotAlias(rawKey)
}
