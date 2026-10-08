import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { getAssetUrl } from '../../src/lib/assets'

export type CharacterKey =
  | 'lobster_pointing'
  | 'lobster_peek'
  | 'lobster_thumbs_up'
  | 'lobster_peaceful'
  | 'lobster_navigator'
  | 'lobster_action'
  | 'crab_stats'
  | 'lobster_engineer'
  | 'lobster_pointing_junior'
  | 'lobster_thumbs_up_junior'
  | 'lobster_navigator_junior'
  | 'lobster_peek_junior'
  | 'lobster_peaceful_junior'
  | 'lobster_engineer_junior'
  | 'crab_stats_junior'
  | 'crab_explorer'
  | 'crab_explorer_junior'
  | 'crab_builder'
  | 'crab_builder_junior'
  | 'lobster_archivist'
  | 'crab_ritual_keeper'
  | 'crab_sentinel'
  | 'lobster_oracle_attendant'
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
    filename: 'char_lobster_pointing_adult_v2.webp',
    s3Path: 'images/characters/char_lobster_pointing_adult_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_pointing_adult_v2.webp?v=20261008'),
    description: 'Coral guide raising a welcoming pincer with an adult standing stance',
  },
  lobster_thumbs_up: {
    key: 'lobster_thumbs_up',
    filename: 'char_lobster_thumbs_up_adult_v2.webp',
    s3Path: 'images/characters/char_lobster_thumbs_up_adult_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_thumbs_up_adult_v2.webp?v=20261008'),
    description: 'Apricot lobster raising an approving pincer with an adult standing stance',
  },
  lobster_navigator: {
    key: 'lobster_navigator',
    filename: 'char_lobster_navigator_adult_v2.webp',
    s3Path: 'images/characters/char_lobster_navigator_adult_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_navigator_adult_v2.webp?v=20261008'),
    description: 'Explorer with goggles and utility harness with an adult standing stance',
  },
  lobster_peek: {
    key: 'lobster_peek',
    filename: 'char_lobster_peek_adult_v2.webp',
    s3Path: 'images/characters/char_lobster_peek_adult_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_peek_adult_v2.webp?v=20261008'),
    description: 'Rose lobster leaning curiously with raised pincers with an adult standing stance',
  },
  lobster_peaceful: {
    key: 'lobster_peaceful',
    filename: 'char_lobster_peaceful_adult_v2.webp',
    s3Path: 'images/characters/char_lobster_peaceful_adult_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_peaceful_adult_v2.webp?v=20261008'),
    description: 'Lavender guardian with a calm expression with an adult standing stance',
  },
  lobster_engineer: {
    key: 'lobster_engineer',
    filename: 'char_lobster_engineer_adult_v2.webp',
    s3Path: 'images/characters/char_lobster_engineer_adult_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_engineer_adult_v2.webp?v=20261008'),
    description: 'Engineer with hardhat, tools and diagnostic tablet with an adult standing stance',
  },
  crab_stats: {
    key: 'crab_stats',
    filename: 'char_crab_stats_adult_v2.webp',
    s3Path: 'images/characters/char_crab_stats_adult_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_crab_stats_adult_v2.webp?v=20261008'),
    description: 'Terracotta crab presenting a chart with an adult standing stance',
  },
  lobster_pointing_junior: {
    key: 'lobster_pointing_junior',
    filename: 'char_lobster_pointing_junior_v2.webp',
    s3Path: 'images/characters/char_lobster_pointing_junior_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_pointing_junior_v2.webp?v=20261008'),
    description: 'Coral guide raising a welcoming pincer with short junior legs',
  },
  lobster_thumbs_up_junior: {
    key: 'lobster_thumbs_up_junior',
    filename: 'char_lobster_thumbs_up_junior_v2.webp',
    s3Path: 'images/characters/char_lobster_thumbs_up_junior_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_thumbs_up_junior_v2.webp?v=20261008'),
    description: 'Apricot lobster raising an approving pincer with short junior legs',
  },
  lobster_navigator_junior: {
    key: 'lobster_navigator_junior',
    filename: 'char_lobster_navigator_junior_v2.webp',
    s3Path: 'images/characters/char_lobster_navigator_junior_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_navigator_junior_v2.webp?v=20261008'),
    description: 'Explorer with goggles and utility harness with short junior legs',
  },
  lobster_peek_junior: {
    key: 'lobster_peek_junior',
    filename: 'char_lobster_peek_junior_v2.webp',
    s3Path: 'images/characters/char_lobster_peek_junior_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_peek_junior_v2.webp?v=20261008'),
    description: 'Rose lobster leaning curiously with raised pincers with short junior legs',
  },
  lobster_peaceful_junior: {
    key: 'lobster_peaceful_junior',
    filename: 'char_lobster_peaceful_junior_v2.webp',
    s3Path: 'images/characters/char_lobster_peaceful_junior_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_peaceful_junior_v2.webp?v=20261008'),
    description: 'Lavender guardian with a calm expression with short junior legs',
  },
  lobster_engineer_junior: {
    key: 'lobster_engineer_junior',
    filename: 'char_lobster_engineer_junior_v2.webp',
    s3Path: 'images/characters/char_lobster_engineer_junior_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_engineer_junior_v2.webp?v=20261008'),
    description: 'Engineer with hardhat, tools and diagnostic tablet with short junior legs',
  },
  crab_stats_junior: {
    key: 'crab_stats_junior',
    filename: 'char_crab_stats_junior_v2.webp',
    s3Path: 'images/characters/char_crab_stats_junior_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_crab_stats_junior_v2.webp?v=20261008'),
    description: 'Terracotta crab presenting a chart with short junior legs',
  },
  crab_explorer: {
    key: 'crab_explorer',
    filename: 'char_crab_explorer_adult_v2.webp',
    s3Path: 'images/characters/char_crab_explorer_adult_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_crab_explorer_adult_v2.webp?v=20261008'),
    description: 'Blue crab explorer with compass, goggles and satchel with an adult standing stance',
  },
  crab_explorer_junior: {
    key: 'crab_explorer_junior',
    filename: 'char_crab_explorer_junior_v2.webp',
    s3Path: 'images/characters/char_crab_explorer_junior_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_crab_explorer_junior_v2.webp?v=20261008'),
    description: 'Blue crab explorer with compass, goggles and satchel with short junior legs',
  },
  crab_builder: {
    key: 'crab_builder',
    filename: 'char_crab_builder_adult_v2.webp',
    s3Path: 'images/characters/char_crab_builder_adult_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_crab_builder_adult_v2.webp?v=20261008'),
    description: 'Purple crab builder with hardhat and spanner with an adult standing stance',
  },
  crab_builder_junior: {
    key: 'crab_builder_junior',
    filename: 'char_crab_builder_junior_v2.webp',
    s3Path: 'images/characters/char_crab_builder_junior_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_crab_builder_junior_v2.webp?v=20261008'),
    description: 'Purple crab builder with hardhat and spanner with short junior legs',
  },
  lobster_archivist: {
    key: 'lobster_archivist',
    filename: 'char_lobster_archivist_adult_v2.webp',
    s3Path: 'images/characters/char_lobster_archivist_adult_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_archivist_adult_v2.webp?v=20261008'),
    description: 'Scholar with scripture book and shoulder mantle with an adult standing stance',
  },
  crab_ritual_keeper: {
    key: 'crab_ritual_keeper',
    filename: 'char_crab_ritual_keeper_adult_v2.webp',
    s3Path: 'images/characters/char_crab_ritual_keeper_adult_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_crab_ritual_keeper_adult_v2.webp?v=20261008'),
    description: 'Ritual keeper with brass bell and ledger with an adult standing stance',
  },
  crab_sentinel: {
    key: 'crab_sentinel',
    filename: 'char_crab_sentinel_adult_v2.webp',
    s3Path: 'images/characters/char_crab_sentinel_adult_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_crab_sentinel_adult_v2.webp?v=20261008'),
    description: 'Armored sentinel with shield and welcoming pincer with an adult standing stance',
  },
  lobster_oracle_attendant: {
    key: 'lobster_oracle_attendant',
    filename: 'char_lobster_oracle_attendant_adult_v2.webp',
    s3Path: 'images/characters/char_lobster_oracle_attendant_adult_v2.webp',
    publicUrl: getAssetUrl('images/characters/char_lobster_oracle_attendant_adult_v2.webp?v=20261008'),
    description: 'Ivory Oracle attendant with listening instrument with an adult standing stance',
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
  const normKey = normalizeMascotKey(characterKeyOrFilename)
  if (normKey === 'random' || normKey === 'dice' || normKey === 'shuffle') {
    return CHARACTER_REGISTRY[getRandomCharacterKey()]
  }
  if (CHARACTER_REGISTRY[normKey]) {
    return CHARACTER_REGISTRY[normKey]
  }

  const filename = `char_${normKey}.png`
  return {
    key: normKey,
    filename,
    s3Path: `images/characters/${filename}`,
    publicUrl: getAssetUrl(`images/characters/${filename}`),
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
    getAssetUrl(`images/characters/${baseName}.webp?v=20261008`),
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
  if (!rawKey) return 'lobster_thumbs_up'
  const raw = rawKey.toLowerCase().trim().replace(/\.(png|jpg|webp)$/, '').replace(/^char_/, '')
  const registered = Object.values(CHARACTER_REGISTRY).find(
    (info) => info.filename.replace(/^char_/, '').replace(/\.[^/.]+$/, '') === raw
  )
  if (registered) return registered.key

  if (raw === 'lobster_pointing_cta' || raw === 'pointing' || raw === 'cta' || raw === 'lobster_cta') return 'lobster_pointing'
  if (raw === 'lobster_corner_peek' || raw === 'peek' || raw === 'corner_peek') return 'lobster_peek'
  if (raw === 'crab_pointing_stats' || raw === 'crab_stats' || raw === 'stats' || raw === 'pointing_stats') return 'crab_stats'
  if (raw === 'lobster_navigator' || raw === 'navigator' || raw === 'explorer' || raw === 'lobster_speed_action' || raw === 'speed_action' || raw === 'lobster_action' || raw === 'action' || raw === 'speed') return 'lobster_navigator'
  if (raw === 'lobster_floating_peaceful' || raw === 'floating_peaceful' || raw === 'peaceful' || raw === 'zen' || raw === 'floating') return 'lobster_peaceful'
  if (raw === 'lobster_engineer' || raw === 'engineer' || raw === 'diagnostic' || raw === 'hardhat') return 'lobster_engineer'
  if (raw === 'thumbs_up' || raw === 'thumbs' || raw === 'approval' || raw === 'lobster_thumbs') return 'lobster_thumbs_up'

  return raw
}

