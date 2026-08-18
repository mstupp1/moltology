import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'

const ARTIFACT_DIR = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/68f0fb76-c6b4-4fac-86df-6abe2aa8515d')

const SLIDE_PATHS = [
  path.join(ARTIFACT_DIR, '.user_uploaded/media_1787079997362.jpg'),
  path.join(ARTIFACT_DIR, '.user_uploaded/media_1787080164872.jpg'),
  path.join(ARTIFACT_DIR, '.user_uploaded/media_1787080177641.jpg'),
]

async function formatToInstagram4x5(inputPath: string, outputPath: string): Promise<string> {
  const targetWidth = 1080
  const targetHeight = 1350 // Exact 4:5 (0.80)
  const canvas = createCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')

  const img = await loadImage(inputPath)

  // Scale to fit width, slight crop on top/bottom or centered
  const scale = Math.max(targetWidth / img.width, targetHeight / img.height)
  const sw = targetWidth / scale
  const sh = targetHeight / scale
  const sx = (img.width - sw) / 2
  // We can bias slightly towards top or center so headers stay completely clear
  const sy = Math.max(0, (img.height - sh) / 2)

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight)

  fs.writeFileSync(outputPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Formatted to 4:5 (1080x1350): ${outputPath}`)
  return outputPath
}

async function main() {
  console.log('Formatting all 3 carousel slides to exact 4:5 (1080x1350)...')
  const uploadedUrls: string[] = []

  for (let i = 0; i < SLIDE_PATHS.length; i++) {
    const outPath = path.join(ARTIFACT_DIR, `slide${i + 1}_4x5.jpg`)
    await formatToInstagram4x5(SLIDE_PATHS[i], outPath)

    const s3Key = `images/social/test-time-compute-kv-cache-ecdysis/slide${i + 1}.jpg`
    const res = await uploadLocalFileToS3(outPath, s3Key)
    console.log(`✓ Uploaded slide ${i + 1} to S3: ${res.publicUrl}`)
    uploadedUrls.push(res.publicUrl)
  }

  console.log('\nAll 3 slides formatted and uploaded to S3!')
  console.log(uploadedUrls.join(','))
}

main().catch(console.error)
