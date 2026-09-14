#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'
import { DEFAULT_BUCKET } from '../src/lib/s3-client'

export const MODEL_ALIASES: Record<string, string> = {
  'nano-banana-pro': 'gemini-3-pro-image',
  'nano-banana-2': 'gemini-3.1-flash-image',
  'nano-banana-2-lite': 'gemini-3.1-flash-lite-image',
  'nano-banana': 'gemini-2.5-flash-image',
  'pro': 'gemini-3-pro-image',
  'flash': 'gemini-3.1-flash-image',
  'gemini-3-pro': 'gemini-3-pro-image',
  'gemini-3-pro-image': 'gemini-3-pro-image',
  'gemini-3-pro-image-preview': 'gemini-3-pro-image-preview',
  'gemini-3.1-flash': 'gemini-3.1-flash-image',
  'gemini-3.1-flash-image': 'gemini-3.1-flash-image',
  'gemini-2.5-flash-image': 'gemini-2.5-flash-image',
}

export interface GenerateImageOptions {
  prompt: string
  referenceImagePath?: string
  model?:
    | 'gemini-3-pro-image'
    | 'gemini-3.1-flash-image'
    | 'gemini-2.5-flash-image'
    | 'nano-banana-pro'
    | 'nano-banana-2'
    | 'pro'
    | 'flash'
    | string
  aspectRatio?: '9:16' | '16:9' | '1:1' | '4:5' | '3:4' | string
  imageSize?: '1K' | '2K' | '4K' | string
  outputFilePath?: string
  uploadToS3?: boolean
  s3Key?: string
  bucket?: string
}

export interface GenerateImageResult {
  localPath: string
  s3Key?: string
  publicUrl?: string
  model: string
  aspectRatio: string
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  return 'image/png'
}

export async function generateGeminiImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VERTEX_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('Missing API key in environment variables (GEMINI_API_KEY or VERTEX_API_KEY).')
  }

  const rawModel = options.model || 'gemini-3-pro-image'
  const model = MODEL_ALIASES[rawModel.toLowerCase()] || rawModel
  const aspectRatio = options.aspectRatio || '9:16'
  const imageSize = options.imageSize || '2K'
  const uploadToS3 = options.uploadToS3 ?? false
  const bucket = options.bucket || DEFAULT_BUCKET

  const outDir = options.outputFilePath ? path.dirname(options.outputFilePath) : path.resolve(process.cwd(), 'tmp')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  const outputPath = options.outputFilePath || path.resolve(outDir, `gemini-img-${Date.now()}.png`)

  console.log(`\n🎨 Initiating Gemini image generation...`)
  console.log(`   • Model: ${model} (${model.includes('3-pro') ? 'Nano Banana Pro' : model.includes('3.1') ? 'Nano Banana 2' : 'Nano Banana'})`)
  console.log(`   • Aspect Ratio: ${aspectRatio}`)
  console.log(`   • Resolution: ${imageSize}`)
  if (options.referenceImagePath) {
    console.log(`   • Reference Image: ${options.referenceImagePath}`)
  }
  console.log(`   • Prompt: "${options.prompt.slice(0, 120)}${options.prompt.length > 120 ? '...' : ''}"`)

  const parts: any[] = []

  if (options.referenceImagePath) {
    if (!fs.existsSync(options.referenceImagePath)) {
      throw new Error(`Reference image not found at: ${options.referenceImagePath}`)
    }
    const refBuffer = fs.readFileSync(options.referenceImagePath)
    const mimeType = getMimeType(options.referenceImagePath)
    parts.push({
      inlineData: {
        mimeType,
        data: refBuffer.toString('base64'),
      },
    })
  }

  parts.push({ text: options.prompt })

  const requestBody: any = {
    contents: [{ parts }],
    generationConfig: {
      imageConfig: {
        aspectRatio,
        imageSize,
      },
    },
  }

  const submitUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const response = await fetch(submitUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Failed to generate image from Gemini API (${response.status}): ${errText}`)
  }

  const data = (await response.json()) as any

  if (data.error) {
    throw new Error(`Gemini image generation failed: ${JSON.stringify(data.error)}`)
  }

  const candidateParts = data.candidates?.[0]?.content?.parts
  if (!candidateParts || candidateParts.length === 0) {
    throw new Error(`No candidates or parts returned by Gemini API: ${JSON.stringify(data)}`)
  }

  let base64Data: string | null = null
  let mimeType = 'image/png'

  for (const part of candidateParts) {
    if (part.inlineData?.data) {
      base64Data = part.inlineData.data
      if (part.inlineData.mimeType) {
        mimeType = part.inlineData.mimeType
      }
      break
    }
  }

  if (!base64Data) {
    const textPart = candidateParts.find((p: any) => p.text)?.text
    throw new Error(`Gemini API did not return image data. Response text: ${textPart || JSON.stringify(candidateParts)}`)
  }

  const imageBuffer = Buffer.from(base64Data, 'base64')
  fs.writeFileSync(outputPath, imageBuffer)
  console.log(`   ✅ Saved image to: ${outputPath} (${Math.round(imageBuffer.length / 1024)} KB)`)

  let s3Key = options.s3Key
  let publicUrl: string | undefined

  if (uploadToS3) {
    s3Key = s3Key || `images/social/gemini/${path.basename(outputPath)}`
    console.log(`   ☁️ Uploading to S3: ${s3Key}...`)
    const uploadResult = await uploadLocalFileToS3(outputPath, s3Key, bucket)
    publicUrl = uploadResult.publicUrl
    console.log(`   🚀 Public S3 URL: ${publicUrl}`)
  }

  return {
    localPath: outputPath,
    s3Key,
    publicUrl,
    model,
    aspectRatio,
  }
}

async function runCli() {
  const args = process.argv.slice(2)
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
Usage:
  npx tsx scripts/generate-image.ts "<prompt>" [options]

Options:
  --prompt <text>, -p <text>      Image prompt
  --reference <path>, -r <path>   Path to reference image (for image-to-image elevation)
  --aspect <ratio>, -a <ratio>    Aspect ratio: 9:16 | 16:9 | 1:1 | 4:5 (default: 9:16)
  --size <size>, -s <size>        Resolution: 1K | 2K | 4K (default: 2K)
  --model <name>, -m <name>       Gemini model: nano-banana-pro | nano-banana-2 | pro | flash (default: nano-banana-pro)
  --out <path>, -o <path>         Output file path (default: tmp/gemini-img-<timestamp>.png)
  --upload                        Upload output image to Neon S3
  --s3-key <key>                  Custom S3 key destination

Examples:
  npx tsx scripts/generate-image.ts "Benthic cybernetic crab in deep abyssal trench, bioluminescent neon cyan glow"
  npx tsx scripts/generate-image.ts --model nano-banana-pro --size 2K --prompt "Cybernetic HUD terminal"
  npx tsx scripts/generate-image.ts --reference tmp/base-outro.png --prompt "Elevate into 3D glassmorphic HUD panel with deep caustics" --aspect 9:16 --out tmp/elevated-outro.png
`)
    process.exit(0)
  }

  let prompt = ''
  let referenceImagePath: string | undefined
  let aspectRatio: any = '9:16'
  let imageSize: any = '2K'
  let model: string | undefined
  let outputFilePath: string | undefined
  let uploadToS3 = false
  let s3Key: string | undefined

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--prompt' || args[i] === '-p') && args[i + 1]) prompt = args[++i]
    else if ((args[i] === '--reference' || args[i] === '-r') && args[i + 1]) referenceImagePath = args[++i]
    else if ((args[i] === '--aspect' || args[i] === '-a') && args[i + 1]) aspectRatio = args[++i]
    else if ((args[i] === '--size' || args[i] === '-s') && args[i + 1]) imageSize = args[++i]
    else if ((args[i] === '--model' || args[i] === '-m') && args[i + 1]) model = args[++i]
    else if ((args[i] === '--out' || args[i] === '-o') && args[i + 1]) outputFilePath = args[++i]
    else if (args[i] === '--upload') uploadToS3 = true
    else if (args[i] === '--s3-key' && args[i + 1]) s3Key = args[++i]
    else if (!prompt && !args[i].startsWith('-')) prompt = args[i]
  }

  if (!prompt) {
    console.error('❌ Error: Prompt is required.')
    process.exit(1)
  }

  try {
    await generateGeminiImage({
      prompt,
      referenceImagePath,
      aspectRatio,
      imageSize,
      model,
      outputFilePath,
      uploadToS3,
      s3Key,
    })
  } catch (err: any) {
    console.error(`\n❌ Image generation failed: ${err.message}`)
    process.exit(1)
  }
}

if (process.argv[1]?.includes('generate-image.ts')) {
  runCli()
}
