#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'
import { DEFAULT_BUCKET } from '../src/lib/s3-client'

/**
 * Gemini Omni replaces the Veo 3.1 preview models, which the Gemini API retires on October 22, 2026.
 * Veo model IDs still route to the legacy predictLongRunning endpoint until then.
 */
export const DEFAULT_VIDEO_MODEL = 'gemini-omni-1.1-flash'

export type OmniResolution = '360p' | '720p' | '1080p' | '4k'

export interface GenerateVideoOptions {
  prompt: string
  /** Optional still image to animate (image-to-video). The clip starts from this frame. */
  referenceImagePath?: string
  /** What the model should avoid (e.g. on-screen text). Omni takes it as prompt text; Veo drops it if the API rejects the field. */
  negativePrompt?: string
  model?: 'gemini-omni-1.1-flash' | 'veo-3.1-lite-generate-preview' | 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview' | string
  aspectRatio?: '9:16' | '16:9' | '1:1'
  /** Veo takes this as a parameter. Omni has no duration field, so it is asked for in the prompt and the clip length may differ. */
  durationSeconds?: number
  /** Omni only (default 720p). 1080p and 4k are upscaled and cost more per second. */
  resolution?: OmniResolution
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
  /** Veo operation name, or the Omni interaction id (usable as previous_interaction_id to extend the clip). */
  operationName: string
  model: string
  durationSeconds: number
  aspectRatio: string
}

export function getImageMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  return 'image/png'
}

export function isOmniModel(model: string): boolean {
  return !model.startsWith('veo-')
}

/** Omni has no duration or negative-prompt fields, so both go into the prompt text, as its prompt guide recommends. */
export function buildOmniPrompt(prompt: string, durationSeconds?: number, negativePrompt?: string): string {
  const parts = [prompt.trim()]
  if (durationSeconds) {
    parts.push(`One continuous ${durationSeconds}-second shot with no scene cuts.`)
  }
  if (negativePrompt) {
    parts.push(`No ${negativePrompt}.`)
  }
  return parts.join(' ')
}

export function buildOmniRequest(options: {
  model: string
  prompt: string
  aspectRatio: string
  resolution?: OmniResolution
  image?: { data: string; mimeType: string }
}): Record<string, unknown> {
  const input = options.image
    ? [
        { type: 'image', data: options.image.data, mime_type: options.image.mimeType },
        { type: 'text', text: options.prompt },
      ]
    : options.prompt
  return {
    model: options.model,
    input,
    // Omni only renders 9:16 and 16:9.
    response_format: {
      type: 'video',
      aspect_ratio: options.aspectRatio === '16:9' ? '16:9' : '9:16',
      resolution: options.resolution || '720p',
    },
    background: true,
    store: true,
  }
}

/** Finds the generated video in an interaction, whether it sits in steps[].content or outputs[]. */
export function extractOmniVideo(interaction: unknown): { data?: string; uri?: string } | null {
  const stack: unknown[] = [interaction]
  while (stack.length > 0) {
    const node = stack.pop()
    if (Array.isArray(node)) {
      stack.push(...node)
    } else if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      const isVideo = obj.type === 'video' || (typeof obj.mime_type === 'string' && obj.mime_type.startsWith('video/'))
      if (isVideo && (typeof obj.data === 'string' || typeof obj.uri === 'string')) {
        return { data: obj.data as string | undefined, uri: obj.uri as string | undefined }
      }
      stack.push(...Object.values(obj))
    }
  }
  return null
}

async function generateWithOmni(
  options: GenerateVideoOptions,
  model: string,
  aspectRatio: string,
  durationSeconds: number,
  apiKey: string
): Promise<{ buffer: Buffer; operationName: string }> {
  const image = options.referenceImagePath
    ? {
        data: fs.readFileSync(options.referenceImagePath).toString('base64'),
        mimeType: getImageMimeType(options.referenceImagePath),
      }
    : undefined
  const body = buildOmniRequest({
    model,
    prompt: buildOmniPrompt(options.prompt, durationSeconds, options.negativePrompt),
    aspectRatio,
    resolution: options.resolution,
    image,
  })
  const headers = { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }
  const maxAttempts = 4

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const submitResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      // A 400 on submit is free: if the model will not run in the background, wait for it inline instead.
      if (submitResponse.status === 400 && body.background) {
        const errText = await submitResponse.text()
        if (/background/i.test(errText)) {
          console.warn(`\n⚠️ Background generation was rejected; resubmitting as a single blocking request.`)
          delete body.background
          attempt--
          continue
        }
        throw new Error(`Failed to submit video generation request (400): ${errText}`)
      }
      if (!submitResponse.ok) {
        const errText = await submitResponse.text()
        throw new Error(`Failed to submit video generation request (${submitResponse.status}): ${errText}`)
      }

      let interaction = (await submitResponse.json()) as any
      const interactionId: string = interaction.id
      console.log(`⏳ Interaction started (attempt ${attempt}/${maxAttempts}): ${interactionId}`)

      // background=true returns at once; poll until the interaction finishes.
      const startTime = Date.now()
      while (!extractOmniVideo(interaction)) {
        const status = interaction.status
        if (status === 'failed' || status === 'cancelled' || interaction.error) {
          throw new Error(`\nVideo generation failed: ${JSON.stringify(interaction.error ?? status)}`)
        }
        if (status === 'completed') {
          throw new Error(`\nInteraction completed but returned no video: ${JSON.stringify(interaction).slice(0, 500)}`)
        }
        await new Promise((res) => setTimeout(res, 5000))
        process.stdout.write(`\r⏳ Rendering video... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`)
        const pollResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions/${interactionId}`, { headers })
        if (!pollResponse.ok) {
          const errText = await pollResponse.text()
          throw new Error(`\nPolling failed (${pollResponse.status}): ${errText}`)
        }
        interaction = await pollResponse.json()
      }

      const video = extractOmniVideo(interaction)!
      if (video.data) {
        return { buffer: Buffer.from(video.data, 'base64'), operationName: interactionId }
      }
      const downloadUrl = video.uri!.includes('/files/') && !video.uri!.includes(':download')
        ? `${video.uri}:download?alt=media`
        : video.uri!
      const downloadRes = await fetch(downloadUrl, { headers: { 'x-goog-api-key': apiKey } })
      if (!downloadRes.ok) {
        throw new Error(`Failed to download generated video (${downloadRes.status})`)
      }
      return { buffer: Buffer.from(await downloadRes.arrayBuffer()), operationName: interactionId }
    } catch (err: any) {
      if (attempt < maxAttempts && isTransientVideoError(err.message)) {
        const isRateLimit = err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED')
        const backoffSeconds = isRateLimit ? 25 : 6
        console.warn(`\n⚠️ Video generation hit a transient issue (${isRateLimit ? 'Rate limit / 429' : err.message.slice(0, 80)}). Retrying in ${backoffSeconds}s (attempt ${attempt + 1}/${maxAttempts})...`)
        await new Promise((res) => setTimeout(res, backoffSeconds * 1000))
        continue
      }
      throw err
    }
  }
  throw new Error('Video generation failed after all retries.')
}

function isTransientVideoError(message: string): boolean {
  return (
    /"code":\s*13\b/.test(message) ||
    message.includes('internal server issue') ||
    message.includes('503') ||
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED')
  )
}

export async function generateVeoVideo(options: GenerateVideoOptions): Promise<GenerateVideoResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VERTEX_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('Missing API key in environment variables (GEMINI_API_KEY or VERTEX_API_KEY).')
  }

  const model = options.model || DEFAULT_VIDEO_MODEL
  const aspectRatio = options.aspectRatio || '9:16'
  const durationSeconds = options.durationSeconds || 6
  const uploadToS3 = options.uploadToS3 ?? true
  const bucket = options.bucket || DEFAULT_BUCKET

  if (options.outputFilePath && fs.existsSync(options.outputFilePath) && fs.statSync(options.outputFilePath).size > 10000) {
    console.log(`\n✓ Video scene already exists locally at: ${options.outputFilePath}`)
    return {
      localPath: options.outputFilePath,
      operationName: 'cached',
      model,
      durationSeconds,
      aspectRatio,
    }
  }

  console.log(`\n🎬 Initiating video generation...`)
  console.log(`   • Model: ${model}`)
  console.log(`   • Aspect Ratio: ${aspectRatio}`)
  console.log(`   • Duration: ${durationSeconds}s`)
  console.log(`   • Prompt: "${options.prompt}"`)

  if (options.referenceImagePath && !fs.existsSync(options.referenceImagePath)) {
    throw new Error(`Reference image not found: ${options.referenceImagePath}`)
  }

  let buffer: Buffer
  let operationName = ''
  if (isOmniModel(model)) {
    if (options.referenceImagePath) console.log(`   • Reference Image: ${options.referenceImagePath}`)
    ;({ buffer, operationName } = await generateWithOmni(options, model, aspectRatio, durationSeconds, apiKey))
    console.log(`\n✓ Video rendered successfully!`)
  } else {
    ;({ buffer, operationName } = await generateWithVeo(options, model, aspectRatio, durationSeconds, apiKey))
  }

  return saveGeneratedVideo(buffer, options, { operationName, model, durationSeconds, aspectRatio, uploadToS3, bucket })
}

async function generateWithVeo(
  options: GenerateVideoOptions,
  model: string,
  aspectRatio: string,
  durationSeconds: number,
  apiKey: string
): Promise<{ buffer: Buffer; operationName: string }> {
  const instance: Record<string, unknown> = { prompt: options.prompt }
  if (options.referenceImagePath) {
    instance.image = {
      bytesBase64Encoded: fs.readFileSync(options.referenceImagePath).toString('base64'),
      mimeType: getImageMimeType(options.referenceImagePath),
    }
    console.log(`   • Reference Image: ${options.referenceImagePath}`)
  }

  let downloadUri: string | null = null
  let operationName = ''
  const maxAttempts = 4
  let sendNegativePrompt = Boolean(options.negativePrompt)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 1. Submit long-running prediction request
      const submitUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${apiKey}`
      const submitResponse = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [instance],
          parameters: {
            aspectRatio,
            durationSeconds,
            ...(sendNegativePrompt ? { negativePrompt: options.negativePrompt } : {}),
          },
        }),
      })

      if (!submitResponse.ok) {
        const errText = await submitResponse.text()
        throw new Error(`Failed to submit video generation request (${submitResponse.status}): ${errText}`)
      }

      const submitData = (await submitResponse.json()) as { name: string }
      operationName = submitData.name
      console.log(`⏳ Operation started (attempt ${attempt}/${maxAttempts}): ${operationName}`)

      // 2. Poll operation status until done
      const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`

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

      break
    } catch (err: any) {
      // A 400 on submit is free: if it is about negativePrompt, resubmit without it rather than failing the run.
      if (sendNegativePrompt && /\(400\)/.test(err.message) && /negative/i.test(err.message)) {
        console.warn(`\n⚠️ Veo rejected negativePrompt; resubmitting without it.`)
        sendNegativePrompt = false
        attempt--
        continue
      }
      if (attempt < maxAttempts && isTransientVideoError(err.message)) {
        const isRateLimit = err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED')
        const backoffSeconds = isRateLimit ? 25 : 6
        console.warn(`\n⚠️ Veo generation hit transient issue (${isRateLimit ? 'Rate limit / 429' : err.message.slice(0, 80)}). Retrying in ${backoffSeconds}s (attempt ${attempt + 1}/${maxAttempts})...`)
        await new Promise((res) => setTimeout(res, backoffSeconds * 1000))
        continue
      }
      throw err
    }
  }

  console.log(`\n✓ Video rendered successfully!`)

  // 3. Download the generated video
  const downloadUrlWithKey = `${downloadUri}${downloadUri!.includes('?') ? '&' : '?'}key=${apiKey}`
  const videoDownloadRes = await fetch(downloadUrlWithKey)
  if (!videoDownloadRes.ok) {
    throw new Error(`Failed to download generated video (${videoDownloadRes.status})`)
  }

  return { buffer: Buffer.from(await videoDownloadRes.arrayBuffer()), operationName }
}

async function saveGeneratedVideo(
  buffer: Buffer,
  options: GenerateVideoOptions,
  meta: { operationName: string; model: string; durationSeconds: number; aspectRatio: string; uploadToS3: boolean; bucket: string }
): Promise<GenerateVideoResult> {
  const { operationName, model, durationSeconds, aspectRatio, uploadToS3, bucket } = meta
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
  --model <name>      Model ID (default: gemini-omni-1.1-flash)
                      The veo-3.1-*-generate-preview models also work until they retire on October 22, 2026
  --aspect <ratio>    Aspect ratio (default: 9:16). Options: 9:16 | 16:9 (1:1 is Veo only)
  --duration <sec>    Duration in seconds (default: 6). Omni treats it as a prompt hint (about 3 to 10s)
  --resolution <res>  Omni resolution (default: 720p). Options: 360p | 720p | 1080p | 4k
  --key <s3Key>       Custom S3 destination key
  --out <path>        Custom local output path
  --image <path>      Animate a still image (image-to-video); the clip starts from this frame
  --keep-local        Keep the temporary video file locally after uploading to S3
  --no-upload         Skip upload to Neon S3 (preserves local file)

Examples:
  npx tsx scripts/generate-video.ts "A cinematic crab walking through a neon cyberpunk Tokyo street"
  npx tsx scripts/generate-video.ts "Ocean waves in sunset" --aspect 16:9 --duration 8
`)
    process.exit(0)
  }

  let prompt = ''
  let model = DEFAULT_VIDEO_MODEL
  let resolution: OmniResolution | undefined
  let aspectRatio: '9:16' | '16:9' | '1:1' = '9:16'
  let durationSeconds = 6
  let uploadToS3 = true
  let keepLocal = false
  let s3Key: string | undefined
  let outputFilePath: string | undefined
  let referenceImagePath: string | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prompt' && args[i + 1]) {
      prompt = args[++i]
    } else if (args[i] === '--model' && args[i + 1]) {
      model = args[++i]
    } else if (args[i] === '--aspect' && args[i + 1]) {
      aspectRatio = args[++i] as any
    } else if (args[i] === '--resolution' && args[i + 1]) {
      resolution = args[++i] as OmniResolution
    } else if (args[i] === '--duration' && args[i + 1]) {
      durationSeconds = parseInt(args[++i], 10)
    } else if (args[i] === '--key' && args[i + 1]) {
      s3Key = args[++i]
    } else if (args[i] === '--out' && args[i + 1]) {
      outputFilePath = args[++i]
    } else if (args[i] === '--image' && args[i + 1]) {
      referenceImagePath = args[++i]
    } else if (args[i] === '--keep-local') {
      keepLocal = true
    } else if (args[i] === '--no-upload' || args[i] === '--no-s3') {
      uploadToS3 = false
      keepLocal = true
    } else if (!args[i].startsWith('-') && !prompt) {
      prompt = args[i]
    }
  }

  if (!prompt) {
    console.error('❌ Error: Missing prompt for video generation.')
    process.exit(1)
  }

  try {
    const result = await generateVeoVideo({
      prompt,
      referenceImagePath,
      model,
      aspectRatio,
      durationSeconds,
      resolution,
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
