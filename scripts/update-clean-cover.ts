import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const ARTIFACT_DIR = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/efaeeaa6-c7b9-4ef7-aee9-e938534ffe70')

async function createCleanCover() {
  const width = 1600
  const height = 900
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Load pure 3D Abyssal Vent & Swarm render
  const baseImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/8a69c8b6-7454-49bb-9447-49f0799ef406/abyssal_vent_pod_1786655965996.jpg')
  const baseImg = await loadImage(baseImgPath)
  ctx.drawImage(baseImg, 0, 0, width, height)

  // Subtle natural oceanic grading (no text, no boxes, no modals, no HUD overlays)
  const vig = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.35, width * 0.5, height * 0.5, width * 0.8)
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vig.addColorStop(0.7, 'rgba(1, 6, 10, 0.25)')
  vig.addColorStop(1, 'rgba(0, 3, 5, 0.6)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, width, height)

  const outPath = path.join(ARTIFACT_DIR, 'test_time_compute_cover_hero.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Clean 3D Featured Cover (No text/modals): ${outPath}`)
}

createCleanCover().catch(console.error)
