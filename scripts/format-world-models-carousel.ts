import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'

const ARTIFACT_DIR = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/32ddf2c7-44af-4ee0-9023-839f14723d15')

const SLIDE_PATHS = [
  path.join(ARTIFACT_DIR, 'mockup_carousel_slide1.jpg'),
  path.join(ARTIFACT_DIR, 'mockup_carousel_slide2.jpg'),
  path.join(ARTIFACT_DIR, 'mockup_carousel_slide3.jpg'),
]

async function formatToInstagram4x5(inputPath: string, outputPath: string): Promise<string> {
  const targetWidth = 1080
  const targetHeight = 1350 // Exact 4:5 (0.80 ratio)
  const canvas = createCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')

  const img = await loadImage(inputPath)

  // Scale to fit width, centered / slight top bias
  const scale = Math.max(targetWidth / img.width, targetHeight / img.height)
  const sw = targetWidth / scale
  const sh = targetHeight / scale
  const sx = (img.width - sw) / 2
  const sy = Math.max(0, (img.height - sh) / 2)

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight)

  fs.writeFileSync(outputPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Formatted to 4:5 (1080x1350): ${outputPath}`)
  return outputPath
}

async function main() {
  console.log('Formatting all 3 carousel slides to exact 4:5 (1080x1350) and uploading to S3...')
  const uploadedUrls: string[] = []

  for (let i = 0; i < SLIDE_PATHS.length; i++) {
    const outPath = path.join(ARTIFACT_DIR, `world_models_slide${i + 1}_4x5.jpg`)
    await formatToInstagram4x5(SLIDE_PATHS[i], outPath)

    const s3Key = `images/social/world-foundation-models-pixel-ecdysis-latent-jepa/slide${i + 1}.jpg`
    const res = await uploadLocalFileToS3(outPath, s3Key)
    console.log(`✓ Uploaded slide ${i + 1} to S3: ${res.publicUrl}`)
    uploadedUrls.push(res.publicUrl)
  }

  console.log('\nAll 3 slides formatted and uploaded to S3!')
  console.log('Slide URLs:\n' + uploadedUrls.join('\n'))
}

main().catch(console.error)
