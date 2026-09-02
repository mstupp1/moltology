import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { S3_BASE_URL } from '../../src/lib/assets'

export type CharacterKey =
  | 'lobster_pointing'
  | 'lobster_peek'
  | 'lobster_thumbs_up'
  | 'lobster_peaceful'
  | 'lobster_navigator'
  | 'lobster_action'
  | 'crab_stats'
  | 'lobster_engineer'
  | 'random'
  | 'none'
  | (string & {})

export interface CharacterInfo {
  key: string
  filename: string
  s3Path: string
  publicUrl: string
  description?: string
}

export const CHARACTER_REGISTRY: Record<string, CharacterInfo> = {
  lobster_pointing: {
    key: 'lobster_pointing',
    filename: 'char_lobster_pointing_cta.webp',
    s3Path: 'images/characters/char_lobster_pointing_cta.webp',
    publicUrl: `${S3_BASE_URL}/images/characters/char_lobster_pointing_cta.webp`,
    description: 'Hero lobster pointing directly at call to action buttons or key links',
  },
  lobster_peek: {
    key: 'lobster_peek',
    filename: 'char_lobster_corner_peek.webp',
    s3Path: 'images/characters/char_lobster_corner_peek.webp',
    publicUrl: `${S3_BASE_URL}/images/characters/char_lobster_corner_peek.webp`,
    description: 'Playful lobster peeking over top or side container bezels',
  },
  lobster_thumbs_up: {
    key: 'lobster_thumbs_up',
    filename: 'char_lobster_thumbs_up.webp',
    s3Path: 'images/characters/char_lobster_thumbs_up.webp',
    publicUrl: `${S3_BASE_URL}/images/characters/char_lobster_thumbs_up.webp`,
    description: 'Cheerful lobster giving a thumbs-up approval sign',
  },
  lobster_peaceful: {
    key: 'lobster_peaceful',
    filename: 'char_lobster_floating_peaceful.webp',
    s3Path: 'images/characters/char_lobster_floating_peaceful.webp',
    publicUrl: `${S3_BASE_URL}/images/characters/char_lobster_floating_peaceful.webp`,
    description: 'Calm cyber-lobster floating peacefully in deep benthic waters',
  },
  lobster_navigator: {
    key: 'lobster_navigator',
    filename: 'char_lobster_navigator.webp',
    s3Path: 'images/characters/char_lobster_navigator.webp',
    publicUrl: `${S3_BASE_URL}/images/characters/char_lobster_navigator.webp?v=1`,
    description: 'Adventurous lobster navigator wearing benthic goggles with holographic depth compass',
  },
  crab_stats: {
    key: 'crab_stats',
    filename: 'char_crab_pointing_stats.webp',
    s3Path: 'images/characters/char_crab_pointing_stats.webp',
    publicUrl: `${S3_BASE_URL}/images/characters/char_crab_pointing_stats.webp`,
    description: 'Energetic crab pointing at quantitative metrics and charts',
  },
  lobster_engineer: {
    key: 'lobster_engineer',
    filename: 'char_lobster_engineer.webp',
    s3Path: 'images/characters/char_lobster_engineer.webp',
    publicUrl: `${S3_BASE_URL}/images/characters/char_lobster_engineer.webp`,
    description: 'Cheerful lobster engineer wearing yellow safety hardhat with holographic diagnostic tablet',
  },
}

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
  const pool = getAllCharacterKeys().filter((k) => !excludeKeys.includes(k))
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
  let raw = characterKeyOrFilename.trim()
  if (raw === 'random' || raw === 'dice' || raw === 'shuffle') {
    return CHARACTER_REGISTRY[getRandomCharacterKey()]
  }
  if (raw.endsWith('.png') || raw.endsWith('.jpg') || raw.endsWith('.webp')) {
    raw = raw.replace(/\.[^/.]+$/, '')
  }

  const normKey = (
    raw === 'lobster_pointing_cta' || raw === 'pointing' ? 'lobster_pointing' :
    raw === 'lobster_corner_peek' || raw === 'peek' ? 'lobster_peek' :
    raw === 'crab_pointing_stats' || raw === 'crab_stats' || raw === 'stats' ? 'crab_stats' :
    raw === 'lobster_navigator' || raw === 'navigator' || raw === 'explorer' || raw === 'lobster_speed_action' || raw === 'speed_action' || raw === 'action' ? 'lobster_navigator' :
    raw === 'lobster_floating_peaceful' || raw === 'peaceful' ? 'lobster_peaceful' :
    raw === 'lobster_engineer' || raw === 'engineer' || raw === 'diagnostic' ? 'lobster_engineer' :
    raw === 'thumbs_up' ? 'lobster_thumbs_up' :
    raw
  )

  if (CHARACTER_REGISTRY[normKey]) {
    return CHARACTER_REGISTRY[normKey]
  }

  // Dynamic S3 fallback for any character file in images/characters/
  const filename = normKey.startsWith('char_') ? `${normKey}.png` : `char_${normKey}.png`
  return {
    key: normKey,
    filename,
    s3Path: `images/characters/${filename}`,
    publicUrl: `${S3_BASE_URL}/images/characters/${filename}`,
  }
}

/**
 * Load character image from local filesystem or fetch from Neon S3 bucket
 */
export async function loadCharacterImage(characterKey: CharacterKey | string): Promise<any> {
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
