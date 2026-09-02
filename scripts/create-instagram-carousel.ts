#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { captureComposite } from './lib/composite-renderer'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'
import { DEFAULT_BUCKET } from '../src/lib/s3-client'
import { CharacterKey, getRandomCharacterRotation, getCharacterInfo } from './lib/character-overlay'

export interface CarouselSlideConfig {
  slideNumber: number
  template: 'hook' | 'spec-showdown' | 'directives' | 'marketing-leadmagnet'
  title: string
  outputPath: string
}

export interface CreateCarouselOptions {
  theme?: string
  topic?: string
  articleSlug?: string
  mascot?: CharacterKey | 'none'
  dryRun?: boolean
  publishNow?: boolean
  polishedSlides?: string[]
}

export interface CarouselCopy {
  title: string
  topic: string
  caption: string
  hashtags: string[]
  firstComment: string
}

export const DEFAULT_INSTAGRAM_ACCOUNT_ID = '6a7f7f0777555aae01d99b54' // moltology_org / Silas Trench
export const DEFAULT_PROFILE_ID = '6a7f74b1839bf39ff3b6aaaa' // Moltology Default Profile
export const DEFAULT_CAROUSEL_QUEUE_ID = '6a84b76d2421e968ac81f5bc' // Moltology Carousels (Mon, Wed, Fri at 13:00 EST)

/**
 * Load history ledger
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
 * Append entry to history ledger
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
 * Synthesize carousel caption and copy
 */
export function generateCarouselCopy(theme: string = 'moltmaxxing', customTopic?: string): CarouselCopy {
  const topic = customTopic || `Architecture of ${theme.toUpperCase()}`
  return {
    title: `The Architecture of ${topic}`,
    topic,
    caption: `◈ THE 3-STAGE BENTHIC ARCHITECTURE ◈\n\nTerrestrial software stacks leak attention and throttle under memory pressure.\n\nSwipe through the 3-stage breakdown:\n👉 Slide 1: The Terrestrial Bottleneck (Latency & Memory Walls)\n👉 Slide 2: The Sub-Benthic Solution (Latent Attention & 800 Nm Torque)\n👉 Slide 3: Evolutionary Directives (Action Checklist)\n\n👇 Read the full unredacted engineering breakdown at moltology.org/news\n🔗 Link in bio & live story telemetry feed\n\n#moltology #carcinization #deepwork #ecdysis #pincertorque #softwareengineering`,
    hashtags: ['#moltology', '#carcinization', '#deepwork', '#ecdysis', '#pincertorque', '#softwareengineering'],
    firstComment: `💬 Explore the full technical manual & blueprints on moltology.org/news! 🦞`,
  }
}

/**
 * Build Google Flow prompt directives for each slide
 */
export function buildSlideGoogleFlowPrompt(slideNum: number, template: string, theme: string, mascotKey?: string): string {
  const narrativeRoles: Record<number, string> = {
    1: 'Stage 1 Hook & Bottleneck: Expose legacy friction with subtle dark glitch and crimson alert accents (#ef4444).',
    2: 'Stage 2 Breakthrough Mechanism: Showcase pristine cybernetic flowchart/spec matrix with luminous cyan (#00ffff) and amber traces.',
    3: 'Stage 3 Action Directives & CTA: Clean hero victory console with prominent action badge and official MoltNation seal.',
  }

  const mascotDesc = (() => {
    if (!mascotKey || mascotKey === 'none') {
      return 'No mascot on this slide'
    }
    const info = getCharacterInfo(mascotKey)
    return `The cartoon crustacean mascot (${info.description || info.key}, Slide ${slideNum})`
  })()

  return `[SLIDE ${slideNum} - GOOGLE FLOW AI ENHANCEMENT DIRECTIVES]
Role: High-End 3D Sci-Fi / Benthic HUD Visual Enhancement Engine
Reference Image: Use the attached 2D composite layout (Slide ${slideNum}) as the exact structural guide and spatial storyboard.
Narrative Phase: ${narrativeRoles[slideNum] || 'Benthic cybernetic telemetry visualization'}

Key Enhancement Directives:
1. Photorealistic 3D Glassmorphic HUD Panels:
   - Transform flat cards into thick, illuminated 3D glassmorphic HUD monitors with subtle rounded bevels, volumetric luminescence, and glowing neon borders.
   - Keep all text razor-sharp, unobstructed, and legible while giving headlines a subtle 3D luminous emboss.
2. NO WASTED SPACE & Dense Composition:
   - Ensure dense, purposeful visual composition with zero dead or empty negative space.
   - Fill background voids with subsea volumetric god rays, dark abyssal water (#030712), subtle organic micro-bubbles, water caustics, and micro-telemetry circuit traces.
3. Seamless Unique Mascot & Character Integration:
   - ${mascotDesc} must be rendered in rich 3D Pixar/DreamWorks style with soft matte chitin texture.
   - Ensure the mascot sits naturally beside the HUD elements without obscuring any text or metrics.
   - Cast natural ambient underwater lighting, gentle caustic reflections, and soft contact shadows without harsh backlights or artificial halo outlines.

Aspect Ratio: 4:5 (1080x1350)
Output Style: Ultra high-resolution, cinematic 8k aesthetic, pristine lighting, zero artifact noise.`
}

/**
 * Main Carousel Generator
 */
export async function createInstagramCarousel(options: CreateCarouselOptions = {}) {
  const timestamp = Date.now()
  const theme = options.theme || 'moltmaxxing'
  const mascot = options.mascot || 'lobster_pointing'
  const tempDir = path.resolve(process.cwd(), 'tmp')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  const copy = generateCarouselCopy(theme, options.topic)

  console.log(`\n======================================================`)
  console.log(`🦞 MOLTOLOGY INSTAGRAM CAROUSEL GENERATOR (Composite Studio)`)
  console.log(`======================================================`)
  console.log(`📌 Topic:  ${copy.topic}`)
  console.log(`🎨 Theme:  ${theme}`)
  console.log(`🎭 Mascot: ${mascot}`)
  console.log(`======================================================\n`)

  // PATH A: Resuming with user's polished Google Flow slides
  if (options.polishedSlides && options.polishedSlides.length > 0) {
    const slidePaths = options.polishedSlides.map((p) => path.resolve(process.cwd(), p))
    for (const sp of slidePaths) {
      if (!fs.existsSync(sp)) {
        throw new Error(`Polished slide not found: ${sp}`)
      }
    }

    console.log(`💎 Using ${slidePaths.length} User Polished Slides (Google Flow)...`)
    const publicUrls: string[] = []

    if (!options.dryRun) {
      console.log(`\n1️⃣ Uploading Polished Slides to Neon S3...`)
      for (let i = 0; i < slidePaths.length; i++) {
        const s3Key = `images/social/carousels/carousel-${timestamp}/slide${i + 1}.png`
        const res = await uploadLocalFileToS3(slidePaths[i], s3Key, DEFAULT_BUCKET)
        publicUrls.push(res.publicUrl)
        console.log(`   🚀 Slide ${i + 1} S3 URL: ${res.publicUrl}`)
      }

      // Record to Continuity Ledger
      recordPostInHistory({
        id: `carousel-${timestamp}`,
        type: 'carousel',
        topic: copy.topic,
        theme,
        mascot,
        slideUrls: publicUrls,
        slideCount: slidePaths.length,
        aspectRatio: '4:5',
        caption: copy.caption,
        hashtags: copy.hashtags,
        firstComment: copy.firstComment,
        status: options.publishNow ? 'published' : 'queued',
        isAiGenerated: true,
      })
    } else {
      console.log(`\n1️⃣ [Dry Run] Skipped S3 upload for ${slidePaths.length} slides.`)
    }

    console.log(`\n======================================================`)
    console.log(`✨ INSTAGRAM CAROUSEL READY FOR PUBLISHING / QUEUEING!`)
    console.log(`======================================================`)
    console.log(`\n📝 CAPTION:\n${copy.caption}`)
    console.log(`\n💬 FIRST COMMENT:\n${copy.firstComment}`)
    console.log(`======================================================\n`)

    return {
      slidePaths,
      publicUrls,
      copy,
      queueConfig: {
        profileId: DEFAULT_PROFILE_ID,
        queueId: DEFAULT_CAROUSEL_QUEUE_ID,
        accountId: DEFAULT_INSTAGRAM_ACCOUNT_ID,
      },
    }
  }

  // PATH B: Generate 3-Slide Composite Scaffolding via Web-Native Composite Studio
  console.log(`1️⃣ Generating 3-Slide Web-Native Composite Scaffolding (Headless Chrome)...`)

  // Mascot rotation: ensure unique, randomized characters per slide from full character registry (never duplicate across slides)
  const rotation = getRandomCharacterRotation(3)
  const slide1Mascot = mascot === 'none' ? 'none' : (mascot && mascot !== 'random' ? mascot : rotation[0])
  const slide2Mascot = mascot === 'none' ? 'none' : (slide1Mascot === rotation[1] ? rotation[0] : rotation[1])
  const slide3Mascot = mascot === 'none' ? 'none' : (slide1Mascot === rotation[2] ? rotation[0] : rotation[2])

  const slideConfigs = [
    {
      num: 1,
      template: 'hook' as const,
      file: `carousel_${timestamp}_slide1_hook.png`,
      mascot: slide1Mascot,
    },
    {
      num: 2,
      template: 'spec-showdown' as const,
      file: `carousel_${timestamp}_slide2_spec.png`,
      mascot: slide2Mascot,
    },
    {
      num: 3,
      template: 'directives' as const,
      file: `carousel_${timestamp}_slide3_directives.png`,
      mascot: slide3Mascot,
    },
  ]

  const compositePaths: string[] = []
  const flowPrompts: string[] = []

  for (const config of slideConfigs) {
    const outPath = path.join(tempDir, config.file)
    console.log(`   📸 Capturing Slide ${config.num} (${config.template} with mascot: ${config.mascot})...`)
    await captureComposite({
      template: config.template,
      theme,
      aspectRatio: '4:5',
      mascot: config.mascot as any,
      outputPath: outPath,
      scaleFactor: 2,
    })
    compositePaths.push(outPath)
    flowPrompts.push(buildSlideGoogleFlowPrompt(config.num, config.template, theme, config.mascot))
  }

  console.log(`\n✅ All 3 Composite Scaffolding Slides Captured in tmp/!`)

  console.log(`\n==============================================================================`)
  console.log(`🎨 GOOGLE FLOW AI POLISH DIRECTIVES FOR ALL 3 SLIDES`)
  console.log(`==============================================================================`)
  for (let i = 0; i < flowPrompts.length; i++) {
    console.log(`\n📍 SLIDE ${i + 1} FILE: ${compositePaths[i]}`)
    console.log(`------------------------------------------------------------------------------`)
    console.log(flowPrompts[i])
    console.log(`------------------------------------------------------------------------------`)
  }
  console.log(`==============================================================================\n`)

  console.log(`==============================================================================`)
  console.log(`👉 NEXT STEPS FOR GOOGLE FLOW POLISH PASS:`)
  console.log(`1. Upload each slide scaffolding image to Google Flow.`)
  console.log(`2. Paste each slide's prompt directive into Google Flow.`)
  console.log(`3. Save polished slides to tmp/ (e.g. 'tmp/polished_slide1.png', 'tmp/polished_slide2.png', 'tmp/polished_slide3.png').`)
  console.log(`4. Run this command to upload to S3 and queue to Zernio:`)
  console.log(`   npm run carousel:create -- --theme ${theme} --polished-slides tmp/polished_slide1.png,tmp/polished_slide2.png,tmp/polished_slide3.png`)
  console.log(`==============================================================================\n`)

  return {
    compositePaths,
    flowPrompts,
    copy,
  }
}

// CLI Entry Point
if (process.argv[1] && process.argv[1].endsWith('create-instagram-carousel.ts')) {
  const args = process.argv.slice(2)
  const getArg = (flag: string) => {
    const idx = args.indexOf(flag)
    return idx !== -1 ? args[idx + 1] : undefined
  }

  const theme = getArg('--theme')
  const topic = getArg('--topic')
  const mascot = getArg('--mascot') as CharacterKey | 'none' | undefined
  const dryRun = args.includes('--dry-run')
  const publishNow = args.includes('--publish-now')
  const polishedSlidesArg = getArg('--polished-slides') || getArg('--input-slides')
  const polishedSlides = polishedSlidesArg ? polishedSlidesArg.split(',').map((s) => s.trim()) : undefined

  createInstagramCarousel({
    theme,
    topic,
    mascot,
    dryRun,
    publishNow,
    polishedSlides,
  }).catch((err) => {
    console.error('❌ Carousel Generation Failed:', err)
    process.exit(1)
  })
}
