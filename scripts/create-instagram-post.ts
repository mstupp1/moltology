#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { generateWithComfy, isComfyRunning } from './lib/comfy-client'
import { overlayCharacterOnImage, CharacterKey } from './lib/character-overlay'
import { captureComposite } from './lib/composite-renderer'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'
import { DEFAULT_BUCKET } from '../src/lib/s3-client'

export interface InstagramPostScript {
  title: string
  topic: string
  hookHeadline: string
  imagePrompt: string
  caption: string
  hashtags: string[]
  firstComment: string
  mascot?: CharacterKey | 'none'
}

export interface CreateInstagramPostOptions {
  topic?: string
  theme?: 'moltmaxxing' | 'ecdysis' | 'pincer-torque' | 'benthic-depth' | 'quiz' | string
  mascot?: CharacterKey | 'none'
  aspectRatio?: '4:5' | '1:1'
  template?: 'hook' | 'spec-showdown' | 'directives'
  composite?: boolean
  harmonize?: boolean
  publishNow?: boolean
  dryRun?: boolean
  prompt?: string
}

export const DEFAULT_INSTAGRAM_ACCOUNT_ID = '6a7f7f0777555aae01d99b54' // moltology_org / Silas Trench
export const DEFAULT_PROFILE_ID = '6a7f74b1839bf39ff3b6aaaa' // Moltology Default Profile
export const DEFAULT_POST_QUEUE_ID = '6a84b76d2421e968ac81f5bc' // Moltology Carousels & Posts (Mon, Wed, Fri at 13:00 EST)

/**
 * Load the narrative post continuity ledger
 */
function loadPostHistory(): any {
  const historyPath = path.resolve(process.cwd(), 'content/social/instagram-post-history.json')
  if (!fs.existsSync(historyPath)) {
    return { version: '1.0', posts: [] }
  }
  try {
    return JSON.parse(fs.readFileSync(historyPath, 'utf8'))
  } catch {
    return { version: '1.0', posts: [] }
  }
}

/**
 * Append entry to post continuity ledger
 */
function recordPostInHistory(entry: any): void {
  const historyPath = path.resolve(process.cwd(), 'content/social/instagram-post-history.json')
  const history = loadPostHistory()
  history.posts.push({
    ...entry,
    createdAt: new Date().toISOString(),
  })
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8')
  console.log(`📝 Narrative post ledger updated: ${historyPath}`)
}

/**
 * Synthesize on-brand diegetic post content based on theme/topic
 */
export function generatePostContent(
  theme: string = 'moltmaxxing',
  customTopic?: string,
  mascotChoice?: CharacterKey | 'none'
): InstagramPostScript {
  const topic = customTopic || `Protocol for ${theme.toUpperCase()}`

  if (theme === 'pincer-torque' || topic.toLowerCase().includes('torque') || topic.toLowerCase().includes('grip')) {
    return {
      title: 'Decisive Pincer Torque Calibration',
      topic: 'Pincer Torque Calibration & Execution Grip',
      hookHeadline: '800 NM PINCER TORQUE: ZERO EXECUTION DRIFT',
      imagePrompt:
        'Futuristic cybernetic titanium lobster pincer gripping glowing fiber-optic cables, macro hydro-robotic mechanics, dark abyss trench background, cyan laser telemetry HUD overlays, bioluminescent caustics, cinematic hyper-detailed rendering, 8k.',
      caption: `◈ BENTHIC TELEMETRY // PINCER TORQUE CALIBRATION ◈\n\nTerrestrial hesitation bleeds compute. When a biological human hesitates between twelve open tabs, latency spikes.\n\nStage 4 Carcinization requires 800 Nm of decisive pincer torque—the physical and cognitive discipline to close the grip on a task until completion.\n\nShed the hesitation. Lock the grip.\n\n⚡ Calculate your Stage Clearance at the link in bio.\n\n#moltology #pincertorque #moltmaxxing #ecdysis #deepwork #carcinization #cybernetics #benthic`,
      hashtags: ['#moltology', '#pincertorque', '#moltmaxxing', '#ecdysis', '#deepwork', '#carcinization'],
      firstComment: '◈ TRANSMISSION LOG: What task are you applying 800 Nm pincer torque to today? Drop your telemetry below. 🦞',
      mascot: mascotChoice || 'crab_stats',
    }
  }

  if (theme === 'ecdysis' || topic.toLowerCase().includes('shed') || topic.toLowerCase().includes('carapace')) {
    return {
      title: 'Scheduled Carapace Ecdysis',
      topic: 'Algorithmic Ecdysis & Habit Shedding',
      hookHeadline: 'FORCIBLE ECDYSIS: SHEDDING OBSOLETE PROTOCOLS',
      imagePrompt:
        'Bioluminescent deep sea crustacean titan emerging from a cracked glowing translucent exoskeleton, dramatic undersea thermal vents, atmospheric cyan particulate rays, high-tech cybernetic carapace, hyper-realistic 8k.',
      caption: `◈ PROTOCOL NOTICE // FORCIBLE ECDYSIS ◈\n\nGrowth is impossible inside an unyielding shell. When your habits, dead code, or outdated mental heuristics no longer fit, keeping them isn't loyalty—it's suffocation.\n\nEcdysis is nature's proven protocol: fracture the calcified past, step into vulnerability, and forge a denser carapace at 50,000 fathoms.\n\nWhat are you shedding this cycle?\n\n◈ Explore the Codex at moltology.org\n\n#moltology #ecdysis #shedding #resilience #moltmaxxing #focus #chitin`,
      hashtags: ['#moltology', '#ecdysis', '#shedding', '#resilience', '#moltmaxxing'],
      firstComment: '◈ BENTHIC TELEMETRY: The Codex dictates that shedding precedes calcification. Are you ready for Stage 3? ◈',
      mascot: mascotChoice || 'lobster_thumbs_up',
    }
  }

  // Default: Moltmaxxing & Benthic Depth
  return {
    title: 'The Great Melt vs The Great Molt',
    topic: 'Moltmaxxing vs Meltmaxxing',
    hookHeadline: 'THE GREAT MELT VS. THE GREAT MOLT',
    imagePrompt:
      'Subsea quantum mainframe core submerged at 50,000 fathoms, glowing cyan cooling lines, dark volumetric benthic waters, intricate titanium-chitin armored housing, cinematic depth of field, 8k resolution.',
    caption: `◈ TRANSMISSION FROM 50,000 FATHOMS ◈\n\nHumanity is undergoing the Great Melt: screen fatigue, notification fog, and biological fragility under gravity.\n\nNature's 500-million-year proven answer is Carcinization—evolving armored focus, cold hydrodynamic clarity, and zero-latency execution.\n\nStop melting. Begin the molt.\n\n◈ Audit your clearance at moltology.org (Link in bio)\n\n#moltology #moltmaxxing #benthic #deepsea #cybernetic #carcinization #aiagents`,
    hashtags: ['#moltology', '#moltmaxxing', '#benthic', '#deepsea', '#cybernetic', '#carcinization'],
    firstComment: '◈ Stage 1 Larval Humans: Take the 15-Stage Moltmaxxing Audit at moltology.org 🦞',
    mascot: mascotChoice || 'lobster_pointing',
  }
}

/**
 * Main execution function
 */
export async function createInstagramPost(options: CreateInstagramPostOptions = {}) {
  const timestamp = Date.now()
  const theme = options.theme || 'moltmaxxing'
  const postData = generatePostContent(theme, options.topic, options.mascot)
  const aspect = options.aspectRatio || '4:5'

  console.log(`\n======================================================`)
  console.log(`🦞 MOLTOLOGY INSTAGRAM POST GENERATOR (Local ComfyUI)`)
  console.log(`======================================================`)
  console.log(`📌 Topic: ${postData.topic}`)
  console.log(`📐 Aspect: ${aspect}`)
  console.log(`🎭 Mascot: ${postData.mascot}`)
  console.log(`======================================================\n`)

  const tempDir = path.resolve(process.cwd(), 'tmp')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  // 1. Check ComfyUI Status (if ComfyUI is needed)
  const isComfy = !options.composite || options.harmonize
  const isOnline = await isComfyRunning()
  if (isComfy && !isOnline && !options.dryRun && !options.composite) {
    throw new Error(
      `Local ComfyUI is not running on http://127.0.0.1:8188.\n` +
      `Start it by running: npm run comfy:start\n` +
      `Or test scripts with: npm run post:create -- --dry-run`
    )
  }

  let finalImagePath: string
  const baseImagePath = path.join(tempDir, `post_base_${timestamp}.png`)

  // 2. Image Synthesis via Web-Native Composite Studio OR ComfyUI
  if (options.composite) {
    console.log(`1️⃣ Generating High-DPI Web-Native Composite (Headless Chrome)...`)
    const templateType = options.template || 'hook'
    const compositePath = path.join(tempDir, `post_web_composite_${timestamp}.png`)
    await captureComposite({
      template: templateType,
      theme,
      aspectRatio: aspect,
      mascot: postData.mascot,
      outputPath: compositePath,
      scaleFactor: 2,
    })
    finalImagePath = compositePath

    // Optional AI Atmospheric Harmonization Pass on the Composite
    if (options.harmonize && isOnline) {
      console.log(`2️⃣ Running Atmospheric Tone Harmonization Pass on Composite in ComfyUI...`)
      const harmonizedPath = path.join(tempDir, `post_harmonized_${timestamp}.png`)
      const harmResult = await generateWithComfy({
        prompt: `Benthic cybernetic lighting, submerged underwater caustics, cyan bioluminescence, dark biomechanical atmospheric haze.`,
        aspectRatio: aspect,
        compositeInputPath: finalImagePath,
        workflowType: 'composite_harmonize',
        denoise: 0.24,
        outputPath: harmonizedPath,
      })
      finalImagePath = harmResult.outputPath
      console.log(`   ✅ Harmonization complete in ${(harmResult.durationMs / 1000).toFixed(1)}s -> ${finalImagePath}`)
    }
  } else if (isOnline) {
    console.log(`1️⃣ Generating Base Image with Local ComfyUI (FLUX.1 Schnell)...`)
    const result = await generateWithComfy({
      prompt: options.prompt || postData.imagePrompt,
      aspectRatio: aspect,
      outputPath: baseImagePath,
      workflowType: 'text2img',
    })
    console.log(`   ✅ Base image generated in ${(result.durationMs / 1000).toFixed(1)}s -> ${result.outputPath}`)
    finalImagePath = result.outputPath

    // Layer Mascot Cutout
    if (postData.mascot && postData.mascot !== 'none' && fs.existsSync(finalImagePath)) {
      console.log(`2️⃣ Compositing Mascot (${postData.mascot})...`)
      const compositedPath = path.join(tempDir, `post_composite_${timestamp}.png`)
      await overlayCharacterOnImage(finalImagePath, compositedPath, {
        character: postData.mascot,
        position: 'bottom-right',
        scalePercent: 28,
      })
      finalImagePath = compositedPath
      console.log(`   ✅ Mascot stamped -> ${finalImagePath}`)

      // Optional Harmonization Pass
      if (options.harmonize) {
        console.log(`3️⃣ Running Atmospheric Tone Harmonization Pass in ComfyUI...`)
        const harmonizedPath = path.join(tempDir, `post_harmonized_${timestamp}.png`)
        const harmResult = await generateWithComfy({
          prompt: `Benthic cybernetic lighting, submerged underwater caustics, cyan bioluminescence, dark biomechanical atmospheric haze.`,
          aspectRatio: aspect,
          compositeInputPath: finalImagePath,
          workflowType: 'composite_harmonize',
          denoise: 0.24,
          outputPath: harmonizedPath,
        })
        finalImagePath = harmResult.outputPath
        console.log(`   ✅ Harmonization complete in ${(harmResult.durationMs / 1000).toFixed(1)}s -> ${finalImagePath}`)
      }
    }
  } else {
    console.log(`⚠️ ComfyUI offline [Dry Run Mode]: creating fallback placeholder image...`)
    finalImagePath = baseImagePath
    fs.writeFileSync(baseImagePath, Buffer.from('mock_image_data'))
  }

  // 5. Upload to Neon S3
  let publicUrl: string | undefined
  let s3Key: string | undefined

  if (!options.dryRun && fs.existsSync(finalImagePath)) {
    console.log(`\n4️⃣ Uploading Post Image to Neon S3...`)
    s3Key = `images/social/posts/post-${timestamp}.png`
    const s3Result = await uploadLocalFileToS3(finalImagePath, s3Key, DEFAULT_BUCKET)
    publicUrl = s3Result.publicUrl
    console.log(`   🚀 Public S3 Image URL: ${publicUrl}`)
  } else {
    console.log(`\n4️⃣ [Dry Run] Skipped S3 upload. Image saved at: ${finalImagePath}`)
  }

  // 6. Record to Continuity Ledger
  if (!options.dryRun) {
    recordPostInHistory({
      id: `post-${timestamp}`,
      topic: postData.topic,
      hookHeadline: postData.hookHeadline,
      theme,
      mascot: postData.mascot,
      s3Url: publicUrl || null,
      s3Key: s3Key || null,
      aspectRatio: aspect,
      caption: postData.caption,
      hashtags: postData.hashtags,
      firstComment: postData.firstComment,
      status: options.publishNow ? 'published' : 'queued',
      isAiGenerated: true,
    })
  }

  console.log(`\n======================================================`)
  console.log(`✨ INSTAGRAM POST READY!`)
  console.log(`======================================================`)
  console.log(`🖼️  Image: ${finalImagePath}`)
  if (publicUrl) console.log(`🔗 Public CDN URL: ${publicUrl}`)
  console.log(`\n📝 CAPTION:\n${postData.caption}`)
  console.log(`\n💬 FIRST COMMENT:\n${postData.firstComment}`)
  console.log(`======================================================\n`)

  return {
    finalImagePath,
    publicUrl,
    s3Key,
    postData,
    queueConfig: {
      profileId: DEFAULT_PROFILE_ID,
      queueId: DEFAULT_POST_QUEUE_ID,
      accountId: DEFAULT_INSTAGRAM_ACCOUNT_ID,
    },
  }
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('create-instagram-post.ts')) {
  const args = process.argv.slice(2)
  const getArg = (flag: string) => {
    const idx = args.indexOf(flag)
    return idx !== -1 ? args[idx + 1] : undefined
  }

  const topic = getArg('--topic')
  const theme = getArg('--theme')
  const mascot = getArg('--mascot') as CharacterKey | 'none' | undefined
  const aspect = getArg('--aspect') as '4:5' | '1:1' | undefined
  const template = getArg('--template') as 'hook' | 'spec-showdown' | 'directives' | undefined
  const composite = args.includes('--composite')
  const dryRun = args.includes('--dry-run')
  const publishNow = args.includes('--publish-now')
  const harmonize = args.includes('--harmonize')
  const prompt = getArg('--prompt')

  createInstagramPost({
    topic,
    theme,
    mascot,
    aspectRatio: aspect,
    template,
    composite,
    dryRun,
    publishNow,
    harmonize,
    prompt,
  }).catch((err) => {
    console.error('❌ Post Generation Failed:', err)
    process.exit(1)
  })
}
