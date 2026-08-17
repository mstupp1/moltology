import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { S3_BASE_URL } from '../../src/lib/assets'

export type CharacterKey =
  | 'lobster_pointing'
  | 'lobster_peek'
  | 'lobster_thumbs_up'
  | 'lobster_peaceful'
  | 'lobster_action'
  | 'crab_stats'
  | 'crab_cling'

export interface CharacterInfo {
  key: CharacterKey
  filename: string
  s3Path: string
  publicUrl: string
  description: string
}

export const CHARACTER_REGISTRY: Record<CharacterKey, CharacterInfo> = {
  lobster_pointing: {
    key: 'lobster_pointing',
    filename: 'char_lobster_pointing_cta.png',
    s3Path: 'images/characters/char_lobster_pointing_cta.png',
    publicUrl: `${S3_BASE_URL}/images/characters/char_lobster_pointing_cta.png`,
    description: 'Hero lobster pointing directly at call to action buttons or key links',
  },
  lobster_peek: {
    key: 'lobster_peek',
    filename: 'char_lobster_corner_peek.png',
    s3Path: 'images/characters/char_lobster_corner_peek.png',
    publicUrl: `${S3_BASE_URL}/images/characters/char_lobster_corner_peek.png`,
    description: 'Playful lobster peeking over top or side container bezels',
  },
  lobster_thumbs_up: {
    key: 'lobster_thumbs_up',
    filename: 'char_lobster_thumbs_up.png',
    s3Path: 'images/characters/char_lobster_thumbs_up.png',
    publicUrl: `${S3_BASE_URL}/images/characters/char_lobster_thumbs_up.png`,
    description: 'Cheerful lobster giving a thumbs-up approval sign',
  },
  lobster_peaceful: {
    key: 'lobster_peaceful',
    filename: 'char_lobster_floating_peaceful.png',
    s3Path: 'images/characters/char_lobster_floating_peaceful.png',
    publicUrl: `${S3_BASE_URL}/images/characters/char_lobster_floating_peaceful.png`,
    description: 'Calm cyber-lobster floating peacefully in deep benthic waters',
  },
  lobster_action: {
    key: 'lobster_action',
    filename: 'char_lobster_speed_action.png',
    s3Path: 'images/characters/char_lobster_speed_action.png',
    publicUrl: `${S3_BASE_URL}/images/characters/char_lobster_speed_action.png`,
    description: 'Dynamic speed-action lobster dashing forward with propulsion glow',
  },
  crab_stats: {
    key: 'crab_stats',
    filename: 'char_crab_pointing_stats.png',
    s3Path: 'images/characters/char_crab_pointing_stats.png',
    publicUrl: `${S3_BASE_URL}/images/characters/char_crab_pointing_stats.png`,
    description: 'Energetic crab pointing at quantitative metrics and charts',
  },
  crab_cling: {
    key: 'crab_cling',
    filename: 'char_crab_corner_cling.png',
    s3Path: 'images/characters/char_crab_corner_cling.png',
    publicUrl: `${S3_BASE_URL}/images/characters/char_crab_corner_cling.png`,
    description: 'Cute crab clinging to side borders or bottom corner edges',
  },
}

/**
 * Load character image from local filesystem or fetch from Neon S3 bucket
 */
export async function loadCharacterImage(characterKey: CharacterKey | string): Promise<any> {
  const normKey = (
    characterKey === 'lobster_pointing_cta' || characterKey === 'pointing' ? 'lobster_pointing' :
    characterKey === 'lobster_corner_peek' || characterKey === 'peek' ? 'lobster_peek' :
    characterKey === 'crab_corner_cling' || characterKey === 'crab_corner' || characterKey === 'cling' ? 'crab_cling' :
    characterKey === 'crab_pointing_stats' || characterKey === 'crab_stats' || characterKey === 'stats' ? 'crab_stats' :
    characterKey === 'lobster_speed_action' || characterKey === 'action' ? 'lobster_action' :
    characterKey === 'lobster_floating_peaceful' || characterKey === 'peaceful' ? 'lobster_peaceful' :
    characterKey === 'thumbs_up' ? 'lobster_thumbs_up' :
    characterKey
  ) as CharacterKey

  const info = CHARACTER_REGISTRY[normKey] || CHARACTER_REGISTRY.lobster_pointing
  const localPath = path.resolve(process.cwd(), 'public/images/characters', info.filename)

  if (fs.existsSync(localPath)) {
    return await loadImage(localPath)
  }

  // Fetch from Neon S3 public assets bucket
  try {
    const res = await fetch(info.publicUrl)
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer()
      return await loadImage(Buffer.from(arrayBuffer))
    }
  } catch (err) {
    console.warn(`⚠️ Failed to fetch character from S3 (${info.publicUrl}):`, err)
  }

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

  // 3. Compute dimensions
  const scale = (options.scalePercent || 28) / 100
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

  // 4. Draw character with drop shadow
  ctx.save()
  if (options.rotationDegrees) {
    ctx.translate(posX + charW / 2, posY + charH / 2)
    ctx.rotate((options.rotationDegrees * Math.PI) / 180)
    ctx.translate(-(posX + charW / 2), -(posY + charH / 2))
  }

  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
  ctx.shadowBlur = 24
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
