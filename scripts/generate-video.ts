#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'
import { DEFAULT_BUCKET } from '../src/lib/s3-client'

export interface GenerateVideoOptions {
  prompt: string
  model?: 'veo-3.1-lite-generate-preview' | 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview' | string
  aspectRatio?: '9:16' | '16:9' | '1:1'
  durationSeconds?: number
  uploadToS3?: boolean
  keepLocal?: boolean
  s3Key?: string
  outputFilePath?: string
  bucket?: string
}

export interface GenerateVideoResult {
  localPath: string
  s3Key?: string
  publicUrl?: string
  operationName: string
  model: string
  durationSeconds: number
  aspectRatio: string
}

export async function generateVeoVideo(options: GenerateVideoOptions): Promise<GenerateVideoResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VERTEX_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('Missing API key in environment variables (GEMINI_API_KEY or VERTEX_API_KEY).')
  }

  const model = options.model || 'veo-3.1-lite-generate-preview'
  const aspectRatio = options.aspectRatio || '9:16'
  const durationSeconds = options.durationSeconds || 6
  const uploadToS3 = options.uploadToS3 ?? true
  const bucket = options.bucket || DEFAULT_BUCKET

  console.log(`\n🎬 Initiating video generation...`)
  console.log(`   • Model: ${model}`)
  console.log(`   • Aspect Ratio: ${aspectRatio}`)
  console.log(`   • Duration: ${durationSeconds}s`)
  console.log(`   • Prompt: "${options.prompt}"`)

  // 1. Submit long-running prediction request
  const submitUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${apiKey}`
  const submitResponse = await fetch(submitUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: options.prompt }],
      parameters: {
        aspectRatio,
        durationSeconds,
      },
    }),
  })

  if (!submitResponse.ok) {
    const errText = await submitResponse.text()
    throw new Error(`Failed to submit video generation request (${submitResponse.status}): ${errText}`)
  }

  const submitData = (await submitResponse.json()) as { name: string }
  const operationName = submitData.name
  console.log(`⏳ Operation started: ${operationName}`)

  // 2. Poll operation status until done
  const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`
  let downloadUri: string | null = null

  const startTime = Date.now()
  while (!downloadUri) {
    await new Promise((res) => setTimeout(res, 5000))
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    process.stdout.write(`\r⏳ Rendering video... (${elapsed}s elapsed)`)

    const pollResponse = await fetch(pollUrl)
    if (!pollResponse.ok) {
      const errText = await pollResponse.text()
      throw new Error(`\nPolling failed (${pollResponse.status}): ${errText}`)
    }

    const pollData = (await pollResponse.json()) as any
    if (pollData.error) {
      throw new Error(`\nVideo generation failed: ${JSON.stringify(pollData.error)}`)
    }

    if (pollData.done) {
      const samples = pollData.response?.generateVideoResponse?.generatedSamples
      if (samples && samples.length > 0 && samples[0].video?.uri) {
        downloadUri = samples[0].video.uri
      } else {
        throw new Error(`\nOperation marked done but no video URI was returned: ${JSON.stringify(pollData)}`)
      }
    }
  }

  console.log(`\n✓ Video rendered successfully!`)

  // 3. Download the generated video
  const downloadUrlWithKey = `${downloadUri}${downloadUri.includes('?') ? '&' : '?'}key=${apiKey}`
  const videoDownloadRes = await fetch(downloadUrlWithKey)
  if (!videoDownloadRes.ok) {
    throw new Error(`Failed to download generated video (${videoDownloadRes.status})`)
  }

  const arrayBuffer = await videoDownloadRes.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const slug = options.prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30)
    .replace(/-+$/, '') || 'video'
  const localFileName = `${slug}-${Date.now()}.mp4`
  const localDir = path.resolve(process.cwd(), 'tmp')
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true })
  }
  const localPath = options.outputFilePath || path.join(localDir, localFileName)
  fs.writeFileSync(localPath, buffer)
  console.log(`💾 Saved local copy to: ${localPath} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`)

  // 4. Upload to S3 if requested
  let publicUrl: string | undefined
  let s3Key: string | undefined

  if (uploadToS3) {
    s3Key = options.s3Key || `videos/social/${path.basename(localPath)}`
    console.log(`☁️  Uploading to Neon S3 [${bucket}] -> ${s3Key}...`)
    const uploadResult = await uploadLocalFileToS3(localPath, s3Key, bucket)
    publicUrl = uploadResult.publicUrl
    console.log(`🚀 Public S3 URL: ${publicUrl}`)

    if (!options.keepLocal) {
      try {
        fs.unlinkSync(localPath)
        console.log(`🧹 Cleaned up temporary local file: ${path.basename(localPath)}`)
      } catch (cleanupErr) {
        // Non-fatal
      }
    }
  }

  return {
    localPath: options.keepLocal || !uploadToS3 ? localPath : '',
    s3Key,
    publicUrl,
    operationName,
    model,
    durationSeconds,
    aspectRatio,
  }
}

async function runCli() {
  const args = process.argv.slice(2)
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
Usage:
  npx tsx scripts/generate-video.ts "<prompt>" [options]

Options:
  --model <name>      Model ID (default: veo-3.1-lite-generate-preview)
                      Options: veo-3.1-lite-generate-preview | veo-3.1-fast-generate-preview | veo-3.1-generate-preview
  --aspect <ratio>    Aspect ratio (default: 9:16). Options: 9:16 | 16:9 | 1:1
  --duration <sec>    Duration in seconds (4 to 8, default: 6)
  --key <s3Key>       Custom S3 destination key
  --out <path>        Custom local output path
  --keep-local        Keep the temporary video file locally after uploading to S3
  --no-upload         Skip upload to Neon S3 (preserves local file)

Examples:
  npx tsx scripts/generate-video.ts "A cinematic crab walking through a neon cyberpunk Tokyo street"
  npx tsx scripts/generate-video.ts "Ocean waves in sunset" --aspect 16:9 --duration 8
`)
    process.exit(0)
  }

  const prompt = args[0]
  let model = 'veo-3.1-lite-generate-preview'
  let aspectRatio: '9:16' | '16:9' | '1:1' = '9:16'
  let durationSeconds = 6
  let uploadToS3 = true
  let keepLocal = false
  let s3Key: string | undefined
  let outputFilePath: string | undefined

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--model' && args[i + 1]) {
      model = args[++i]
    } else if (args[i] === '--aspect' && args[i + 1]) {
      aspectRatio = args[++i] as any
    } else if (args[i] === '--duration' && args[i + 1]) {
      durationSeconds = parseInt(args[++i], 10)
    } else if (args[i] === '--key' && args[i + 1]) {
      s3Key = args[++i]
    } else if (args[i] === '--out' && args[i + 1]) {
      outputFilePath = args[++i]
    } else if (args[i] === '--keep-local') {
      keepLocal = true
    } else if (args[i] === '--no-upload') {
      uploadToS3 = false
      keepLocal = true
    }
  }

  try {
    const result = await generateVeoVideo({
      prompt,
      model,
      aspectRatio,
      durationSeconds,
      uploadToS3,
      keepLocal,
      s3Key,
      outputFilePath,
    })

    console.log(`\n🎉 Pipeline completed successfully!`)
    if (result.publicUrl) {
      console.log(`🔗 Link: ${result.publicUrl}\n`)
    }
  } catch (err: any) {
    console.error(`\n❌ Video generation pipeline failed: ${err.message}`)
    process.exit(1)
  }
}

if (process.argv[1]?.includes('generate-video.ts')) {
  runCli()
}
