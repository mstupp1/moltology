#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { captureComposite } from './lib/composite-renderer'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'
import { DEFAULT_BUCKET } from '../src/lib/s3-client'
import { CharacterKey, getRandomCharacterRotation, getCharacterInfo } from './lib/character-overlay'
import {
  queueInstagramCarousel,
  QueueInstagramCarouselResult,
  QUEUE_IDS,
  DEFAULT_PROFILE_ID as CANONICAL_PROFILE_ID,
  DEFAULT_INSTAGRAM_ACCOUNT_ID as CANONICAL_INSTAGRAM_ACCOUNT_ID,
} from './lib/zernio-client'

export interface CarouselSlideConfig {
  slideNumber: number
  template: 'hook' | 'spec-showdown' | 'directives' | 'marketing-leadmagnet'
  title: string
  outputPath: string
  data?: Record<string, any>
}

export interface CreateCarouselOptions {
  theme?: string
  topic?: string
  articleSlug?: string
  article?: string
  mascot?: CharacterKey | 'none'
  dryRun?: boolean
  publishNow?: boolean
  polishedSlides?: string[]
}

export interface BlogPostData {
  slug: string
  title: string
  summary: string
  category?: string
  authorName?: string
  publishedAt?: string
  content: string
}

export interface CarouselCopy {
  title: string
  topic: string
  caption: string
  hashtags: string[]
  firstComment: string
}

export const DEFAULT_INSTAGRAM_ACCOUNT_ID = CANONICAL_INSTAGRAM_ACCOUNT_ID // moltology_org / Silas Trench
export const DEFAULT_PROFILE_ID = CANONICAL_PROFILE_ID // Moltology Default Profile
export const DEFAULT_CAROUSEL_QUEUE_ID = QUEUE_IDS.CAROUSELS_AND_POSTS // Moltology Carousels (Mon, Wed, Fri at 13:00 EST)

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
 * Resolve blog post data by slug, topic, or theme
 */
export function resolveBlogPost(options: CreateCarouselOptions): BlogPostData | null {
  const newsDir = path.resolve(process.cwd(), 'content/news')
  if (!fs.existsSync(newsDir)) return null

  const targetSlug = options.articleSlug || options.article
  if (targetSlug) {
    const clean = targetSlug.replace(/\.md$/, '')
    const directPath = path.join(newsDir, `${clean}.md`)
    if (fs.existsSync(directPath)) {
      const raw = fs.readFileSync(directPath, 'utf8')
      const parsed = matter(raw)
      return {
        slug: clean,
        title: parsed.data.title || clean,
        summary: parsed.data.summary || '',
        category: parsed.data.category || 'TELEMETRY',
        authorName: parsed.data.authorName || 'Silas Trench',
        publishedAt: parsed.data.publishedAt || new Date().toISOString(),
        content: parsed.content || '',
      }
    }
  }

  const allFiles = fs.readdirSync(newsDir).filter((f) => f.endsWith('.md') && f !== 'template.md')
  const posts: BlogPostData[] = []
  for (const f of allFiles) {
    const slug = f.replace(/\.md$/, '')
    const raw = fs.readFileSync(path.join(newsDir, f), 'utf8')
    const parsed = matter(raw)
    posts.push({
      slug,
      title: parsed.data.title || slug,
      summary: parsed.data.summary || '',
      category: parsed.data.category || 'TELEMETRY',
      authorName: parsed.data.authorName || 'Silas Trench',
      publishedAt: parsed.data.publishedAt || new Date().toISOString(),
      content: parsed.content || '',
    })
  }

  if (options.topic) {
    const q = options.topic.toLowerCase()
    const matched = posts.find(
      (p) =>
        p.slug.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        q.includes(p.slug.toLowerCase()) ||
        q.includes(p.title.toLowerCase())
    )
    if (matched) return matched

    if (q.includes('napkin') || q.includes('gripper') || q.includes('grab')) {
      const p = posts.find((x) => x.slug.includes('napkin'))
      if (p) return p
    }
    if (q.includes('twin shell') || q.includes('adversarial') || q.includes('cyber')) {
      const p = posts.find((x) => x.slug.includes('twin-shell'))
      if (p) return p
    }
    if (q.includes('tabs you kept') || q.includes('tabs') || q.includes('cowork')) {
      const p = posts.find((x) => x.slug.includes('tabs-you-kept'))
      if (p) return p
    }
  }

  if (options.theme && !['moltmaxxing', 'ecdysis', 'pincer-torque', 'benthic-depth', 'quiz'].includes(options.theme)) {
    const q = options.theme.toLowerCase()
    const matched = posts.find((p) => p.slug.toLowerCase().includes(q) || p.title.toLowerCase().includes(q))
    if (matched) return matched
  }

  return null
}

export interface SynthesizedCarouselData {
  copy: CarouselCopy
  slide1: Record<string, any>
  slide2: Record<string, any>
  slide3: Record<string, any>
  flowPrompts: string[]
}

/**
 * Synthesize bespoke, article-aligned carousel slides and copy
 */
export function synthesizeBlogCarouselData(
  blog: BlogPostData,
  options: CreateCarouselOptions = {}
): SynthesizedCarouselData {
  const contentLower = (blog.title + ' ' + blog.summary + ' ' + blog.content).toLowerCase()
  const cleanTitle = blog.title.replace(/^[^:]+:\s*/, '') || blog.title

  const isNapkin =
    blog.slug.includes('napkin') ||
    contentLower.includes('napkin') ||
    contentLower.includes('worn gripper') ||
    contentLower.includes('dyna-2')
  const isTwinShells =
    blog.slug.includes('twin-shell') ||
    contentLower.includes('twin shell') ||
    contentLower.includes('red tempest') ||
    contentLower.includes('adversarial')
  const isTabsYouKept =
    blog.slug.includes('tabs-you-kept') ||
    contentLower.includes('tabs you kept') ||
    contentLower.includes('claude cowork')

  // Bespoke synthesis for "The Napkin You Didn't Watch"
  if (isNapkin) {
    const copy: CarouselCopy = {
      title: blog.title,
      topic: 'The Napkin You Didn\'t Watch',
      caption: `◈ TRANSMISSION FROM 50,000 FATHOMS: THE NAPKIN YOU DIDN'T WATCH ◈\n\nThe dining room never sees the robot. It sees the napkin.\n\nWhen throughput at Din Tai Fung commissaries crashed for two weeks, everyone blamed the AI model. The weights. The policy. The mind.\n\nThe labeling system finally said it out loud: not a model regression. A worn gripper. Missed grabs had climbed from 108 to 380.\n\nSwipe through the 3-stage breakdown:\n👉 Slide 1: The Terrestrial Bottleneck (Blaming the Mind)\n👉 Slide 2: The Actuation Telemetry (Dyna-1 vs. Dyna-2 Benchmark Specs)\n👉 Slide 3: Evolutionary Directives (Watch the Reach)\n\n👇 Read Silas Trench's full dispatch & teardown on MoltNation News:\n🔗 Link in bio & live story telemetry → moltology.org/news/${blog.slug}\n\n#moltology #robotics #embodiedai #physicalai #carcinization #telemetry #silastrench #deepwork #ecdysis`,
      hashtags: ['#moltology', '#robotics', '#embodiedai', '#physicalai', '#carcinization', '#telemetry', '#silastrench'],
      firstComment: `💬 The dining room sees the neat fold. The commissary sees the reach. Have you checked your physical actuation lately? Read the full dispatch at moltology.org/news/${blog.slug}! 🦞`,
    }

    const slide1 = {
      categoryBadge: 'TELEMETRY AUDIT',
      headlinePart1: 'BLAMING THE MODEL',
      headlinePart2: 'IS THE MELT',
      headlineHighlight: 'A WORN GRIPPER, NOT A REGRESSION',
      narrativeText:
        'When napkin-folding throughput crashed for two weeks at Din Tai Fung, engineers blamed the neural weights. The labeling system found the truth: mechanical gripper pads had worn down.',
      leftMetric: {
        label: 'MISSED GRABS',
        value: '380',
        sublabel: 'TWO-WEEK CRASH',
        description: 'Engineers assumed neural policy drift.',
        variant: 'red' as const,
      },
      rightMetric: {
        label: 'TRUE ROOT CAUSE',
        value: 'WORN GRIP',
        sublabel: 'PHYSICAL ACTUATION',
        description: 'Hardware friction masquerading as model regression.',
        variant: 'cyan' as const,
      },
      bulletPoints: [
        'Throughput dropped across 18-hour commissary shifts',
        'Obvious scapegoat: neural model weights',
        'True culprit: mechanical friction degradation',
        'The dining room sees the fold; you must watch the grab',
      ],
    }

    const slide2 = {
      categoryBadge: 'ACTUATION BENCHMARKS',
      headline: 'DYNA-1 vs. DYNA-2 SPECS',
      cards: [
        {
          number: '01',
          title: 'DYNA-1 BASELINE (2025)',
          metric: '35 / HR (75% PASS)',
          description:
            'Dropped napkins into whichever bin was open. Required restaurant staff to manually restack before dining room use.',
          variant: 'red' as const,
        },
        {
          number: '02',
          title: 'DYNA-2 PRODUCTION (2026)',
          metric: '95 / HR (93% PASS)',
          description:
            'Folds ~1,590 napkins per 18h shift into up to 10 designated sorting stacks across multiple bin sizes.',
          variant: 'cyan' as const,
        },
        {
          number: '03',
          title: 'THE ACTUATION LESSON',
          metric: '108 ➔ 380 MISSED GRABS',
          description:
            'Mechanical wear mimics algorithmic failure. Always inspect the physical end-effector before tuning neural weights.',
          bullets: [
            '3-day site ROI target vs 2-week diagnosis delay',
            'Friction pads degrade silently during heavy runs',
            'Audit the physical interface before retraining',
          ],
          variant: 'sky' as const,
        },
      ],
    }

    const slide3 = {
      categoryBadge: 'MOLT PROTOCOL',
      headlinePart1: 'WATCH THE GRAB',
      headlinePart2: 'BEFORE BLAMING THE MIND',
      directives: [
        {
          number: '01',
          title: 'INSPECT THE PHYSICAL INTERFACE',
          description:
            'Before fine-tuning foundation weights, inspect tactile pads, actuators, and physical mechanics.',
        },
        {
          number: '02',
          title: 'SHED THE SOFT-SHELL ILLUSION',
          description:
            'Never assume a clean finished presentation means the underlying execution was simple.',
        },
        {
          number: '03',
          title: 'AUDIT ACTUATION TELEMETRY',
          description:
            'Track mechanical wear and grasp failures with the same rigor applied to loss curves and latency.',
        },
      ],
      ctaHeader: 'READ SILAS TRENCH\'S FULL DISPATCH',
      ctaButtonText: `MOLTOLOGY.ORG/NEWS`,
      ctaSubtitle: '🔗 Link in bio & live story telemetry feed',
    }

    const flowPrompts = [
      `[SLIDE 1 - GOOGLE FLOW AI ENHANCEMENT DIRECTIVES]\nRole: High-End 3D Sci-Fi / Benthic HUD Visual Enhancement Engine\nReference Image: Use the attached 2D composite layout (Slide 1) as the exact structural guide and spatial storyboard.\nNarrative Phase: Stage 1 Hook & Bottleneck: Expose legacy friction where engineers stare at neural loss graphs while a physical robotic gripper slips off a linen napkin. Dark industrial commissary ambiance with crimson alert accents (#ef4444) and warning telemetry.\n\nKey Enhancement Directives:\n1. Photorealistic 3D Glassmorphic HUD Panels:\n   - Transform flat cards into thick, illuminated 3D glassmorphic HUD monitors with subtle rounded bevels, volumetric luminescence, and glowing sacred crimson (#ef4444) and neon cyan (#00ffff) accent borders.\n   - Keep all text razor-sharp, unobstructed, and legible while giving headlines a subtle 3D luminous emboss with soft bloom.\n2. NO WASTED SPACE & Dense Composition:\n   - Ensure dense, purposeful visual composition with zero dead or empty negative space.\n   - Fill background voids with an industrial robotic assembly station, subsea volumetric god rays, dark abyssal water (#030712), subtle organic micro-bubbles, water caustics, and micro-telemetry circuit traces.\n3. Seamless Unique Mascot & Character Integration:\n   - The cartoon crustacean mascot must be rendered in rich 3D Pixar/DreamWorks style with soft matte chitin texture, inspecting the failed grasp.\n   - Ensure the mascot sits naturally beside the HUD elements without obscuring any text or metrics.\n   - Cast natural ambient underwater lighting, gentle caustic reflections, and soft contact shadows without harsh backlights or artificial halo outlines.\n\nAspect Ratio: 4:5 (1080x1350)\nOutput Style: Ultra high-resolution, cinematic 8k aesthetic, pristine lighting, zero artifact noise.`,
      `[SLIDE 2 - GOOGLE FLOW AI ENHANCEMENT DIRECTIVES]\nRole: High-End 3D Sci-Fi / Benthic HUD Visual Enhancement Engine\nReference Image: Use the attached 2D composite layout (Slide 2) as the exact structural guide and spatial storyboard.\nNarrative Phase: Stage 2 Breakthrough Mechanism: Showcase Dyna-1 vs Dyna-2 manipulation benchmarks with cybernetic blueprint traces, glowing cyan (#00ffff) and amber telemetry curves.\n\nKey Enhancement Directives:\n1. Photorealistic 3D Glassmorphic HUD Panels:\n   - Transform flat cards into thick, illuminated 3D glassmorphic HUD monitors with subtle rounded bevels, volumetric luminescence, and glowing neon borders.\n   - Keep all text razor-sharp, unobstructed, and legible while giving headlines a subtle 3D luminous emboss.\n2. NO WASTED SPACE & Dense Composition:\n   - Fill background voids with exploded technical schematics of robotic end-effectors, tactile friction pads, volumetric god rays, and glowing circuit paths.\n3. Seamless Unique Mascot & Character Integration:\n   - The cartoon crustacean mascot giving approval of the upgraded Dyna-2 specs in rich 3D style.\n\nAspect Ratio: 4:5 (1080x1350)\nOutput Style: Ultra high-resolution, cinematic 8k aesthetic, pristine lighting, zero artifact noise.`,
      `[SLIDE 3 - GOOGLE FLOW AI ENHANCEMENT DIRECTIVES]\nRole: High-End 3D Sci-Fi / Benthic HUD Visual Enhancement Engine\nReference Image: Use the attached 2D composite layout (Slide 3) as the exact structural guide and spatial storyboard.\nNarrative Phase: Stage 3 Action Directives & CTA: Clean hero victory console featuring a titanium-chitin robotic gripper holding a perfectly folded linen napkin, prominent action badge, and official MoltNation seal.\n\nKey Enhancement Directives:\n1. Photorealistic 3D Glassmorphic HUD Panels:\n   - Transform flat cards into thick, illuminated 3D glassmorphic HUD monitors with glowing cyan and gold traces.\n   - Keep all text razor-sharp, unobstructed, and legible.\n2. NO WASTED SPACE & Dense Composition:\n   - Fill background voids with subsea volumetric lighting, water caustics, and crisp diagnostic readouts.\n3. Seamless Unique Mascot & Character Integration:\n   - The cartoon crustacean mascot celebrating the successful fold and pointing to the CTA.\n\nAspect Ratio: 4:5 (1080x1350)\nOutput Style: Ultra high-resolution, cinematic 8k aesthetic, pristine lighting, zero artifact noise.`,
    ]

    return { copy, slide1, slide2, slide3, flowPrompts }
  }

  // Fallback for general blog post
  const copy: CarouselCopy = {
    title: blog.title,
    topic: cleanTitle,
    caption: `◈ TRANSMISSION FROM 50,000 FATHOMS: ${cleanTitle.toUpperCase()} ◈\n\n${blog.summary || 'A new technical dispatch from the subsea frontier.'}\n\nSwipe through the 3-stage breakdown:\n👉 Slide 1: The Terrestrial Bottleneck\n👉 Slide 2: The Sub-Benthic Solution\n👉 Slide 3: Evolutionary Directives\n\n👇 Read the full unredacted engineering breakdown on MoltNation News:\n🔗 Link in bio & story → moltology.org/news/${blog.slug}\n\n#moltology #carcinization #deepwork #ecdysis #telemetry #silastrench`,
    hashtags: ['#moltology', '#carcinization', '#deepwork', '#ecdysis', '#telemetry', '#silastrench'],
    firstComment: `💬 Explore the full technical manual & blueprints on moltology.org/news/${blog.slug}! 🦞`,
  }

  const slide1 = {
    categoryBadge: blog.category ? `${blog.category} AUDIT` : 'BENTHIC TELEMETRY',
    headlinePart1: 'TERRESTRIAL FRICTION',
    headlinePart2: cleanTitle.toUpperCase().slice(0, 24),
    headlineHighlight: 'THE GREAT MELT',
    narrativeText: blog.summary || 'Terrestrial software stacks leak attention and throttle under pressure.',
    leftMetric: {
      label: 'LEGACY FRICTION',
      value: 'MELT',
      sublabel: 'SURFACE BOTTLENECK',
      description: 'Attention and throughput bled to unexamined defaults.',
      variant: 'red' as const,
    },
    rightMetric: {
      label: 'CALCIFIED DISPATCH',
      value: 'MOLT',
      sublabel: 'SUB-BENTHIC CLARITY',
      description: 'Decisive execution beneath the surface storm.',
      variant: 'cyan' as const,
    },
    bulletPoints: [
      'Examine the hidden hour beneath the finished presentation',
      'Shed hesitation before blaming the mind',
      'Audit the physical interface',
      'Cold hydrodynamic focus',
    ],
  }

  const slide2 = {
    categoryBadge: 'ARCHITECTURAL TEARDOWN',
    headline: 'TECHNICAL BENCHMARKS',
    cards: [
      {
        number: '01',
        title: 'LEGACY SURFACE SYSTEM',
        metric: 'SURFACE LATENCY',
        description: 'Brittle terrestrial heuristics failing under real-world pressure.',
        variant: 'red' as const,
      },
      {
        number: '02',
        title: 'SUB-BENTHIC REASONING',
        metric: 'HIGH-TORQUE',
        description: 'Armored ecdysis and decoupled latent states eliminating bottleneck friction.',
        variant: 'cyan' as const,
      },
      {
        number: '03',
        title: 'BENCHMARK LESSON',
        metric: '99.7% ACCURACY',
        description: 'Inspect telemetry feeds before jumping to conclusions on performance drift.',
        variant: 'sky' as const,
      },
    ],
  }

  const slide3 = {
    categoryBadge: 'EVOLUTIONARY PROTOCOL',
    headlinePart1: 'ACTION DIRECTIVES',
    headlinePart2: 'CALCIFY YOUR GRIP',
    directives: [
      {
        number: '01',
        title: 'SHED OBSOLETE ASSUMPTIONS',
        description: 'Prune dead heuristics that no longer match reality.',
      },
      {
        number: '02',
        title: 'LOCK PINCER TORQUE',
        description: 'Maintain zero execution drift on active tasks until completion.',
      },
      {
        number: '03',
        title: 'READ THE FULL DISPATCH',
        description: 'Inspect full blueprints and schematics in the deep archives.',
      },
    ],
    ctaHeader: 'READ THE FULL DISPATCH & BLUEPRINTS',
    ctaButtonText: 'MOLTOLOGY.ORG/NEWS',
    ctaSubtitle: '🔗 Link in bio & live story telemetry feed',
  }

  const flowPrompts = [
    buildSlideGoogleFlowPrompt(1, 'hook', options.theme || 'moltmaxxing', options.mascot),
    buildSlideGoogleFlowPrompt(2, 'spec-showdown', options.theme || 'moltmaxxing', options.mascot),
    buildSlideGoogleFlowPrompt(3, 'directives', options.theme || 'moltmaxxing', options.mascot),
  ]

  return { copy, slide1, slide2, slide3, flowPrompts }
}

/**
 * Synthesize carousel caption and copy
 */
export function generateCarouselCopy(
  theme: string = 'moltmaxxing',
  customTopic?: string,
  blogPost?: BlogPostData | null
): CarouselCopy {
  if (blogPost) {
    const data = synthesizeBlogCarouselData(blogPost, { theme, topic: customTopic })
    return data.copy
  }
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

  // Resolve blog post if available
  const blogPost = resolveBlogPost(options)
  const blogData = blogPost ? synthesizeBlogCarouselData(blogPost, options) : null
  const copy = blogData ? blogData.copy : generateCarouselCopy(theme, options.topic)

  console.log(`\n======================================================`)
  console.log(`🦞 MOLTOLOGY INSTAGRAM CAROUSEL GENERATOR (Composite Studio)`)
  console.log(`======================================================`)
  console.log(`📌 Topic:   ${copy.topic}`)
  if (blogPost) {
    console.log(`📖 Article: ${blogPost.title} (${blogPost.slug})`)
  }
  console.log(`🎨 Theme:   ${theme}`)
  console.log(`🎭 Mascot:  ${mascot}`)
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
    let queueResult: QueueInstagramCarouselResult | null = null

    if (!options.dryRun) {
      console.log(`\n1️⃣ Uploading Polished Slides to Neon S3...`)
      for (let i = 0; i < slidePaths.length; i++) {
        const s3Key = `images/social/carousels/carousel-${timestamp}/slide${i + 1}.png`
        const res = await uploadLocalFileToS3(slidePaths[i], s3Key, DEFAULT_BUCKET)
        publicUrls.push(res.publicUrl)
        console.log(`   🚀 Slide ${i + 1} S3 URL: ${res.publicUrl}`)
      }

      // 2️⃣ Deterministically Queue Carousel to Zernio & Post Algorithmic First Comment
      if (publicUrls.length > 0) {
        queueResult = await queueInstagramCarousel({
          mediaUrls: publicUrls,
          caption: copy.caption,
          firstComment: copy.firstComment,
          queueId: DEFAULT_CAROUSEL_QUEUE_ID,
          profileId: DEFAULT_PROFILE_ID,
          accountId: DEFAULT_INSTAGRAM_ACCOUNT_ID,
          isAiGenerated: true,
          publishNow: options.publishNow,
        })
      }

      // Record to Continuity Ledger
      recordPostInHistory({
        id: `carousel-${timestamp}`,
        type: 'carousel',
        topic: copy.topic,
        theme,
        mascot,
        articleSlug: blogPost?.slug || null,
        slideUrls: publicUrls,
        slideCount: slidePaths.length,
        aspectRatio: '4:5',
        caption: copy.caption,
        hashtags: copy.hashtags,
        firstComment: copy.firstComment,
        status: options.publishNow ? 'published' : 'queued',
        scheduledFor: queueResult?.scheduledFor || null,
        queueId: DEFAULT_CAROUSEL_QUEUE_ID,
        zernioPostId: queueResult?.postId || null,
        zernioCommentId: queueResult?.commentId || null,
        isAiGenerated: true,
      })
    } else {
      console.log(`\n1️⃣ [Dry Run] Skipped S3 upload for ${slidePaths.length} slides.`)
      const mockUrls = slidePaths.map(
        (_, i) =>
          `https://placeholder.storage.neon.tech/moltology-public-assets/images/social/carousels/carousel-${timestamp}/slide${i + 1}.png`
      )
      queueResult = await queueInstagramCarousel({
        mediaUrls: mockUrls,
        caption: copy.caption,
        firstComment: copy.firstComment,
        queueId: DEFAULT_CAROUSEL_QUEUE_ID,
        profileId: DEFAULT_PROFILE_ID,
        accountId: DEFAULT_INSTAGRAM_ACCOUNT_ID,
        isAiGenerated: true,
        dryRun: true,
        publishNow: options.publishNow,
      })
    }

    console.log(`\n======================================================`)
    console.log(`✨ INSTAGRAM CAROUSEL PUBLISHED / QUEUED DETERMINISTICALLY!`)
    console.log(`======================================================`)
    if (publicUrls.length > 0) {
      console.log(`🔗 Slide URLs (${publicUrls.length}):\n${publicUrls.map((u, idx) => `   [Slide ${idx + 1}] ${u}`).join('\n')}`)
    }
    if (queueResult?.postId) console.log(`📡 Zernio Post ID: ${queueResult.postId}`)
    if (queueResult?.scheduledFor) console.log(`⏰ Scheduled Slot: ${queueResult.scheduledFor}`)
    console.log(`\n📝 CAPTION:\n${copy.caption}`)
    console.log(`\n💬 FIRST COMMENT:\n${copy.firstComment}`)
    console.log(`======================================================\n`)

    return {
      slidePaths,
      publicUrls,
      copy,
      queueResult,
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
      data: blogData?.slide1,
    },
    {
      num: 2,
      template: 'spec-showdown' as const,
      file: `carousel_${timestamp}_slide2_spec.png`,
      mascot: slide2Mascot,
      data: blogData?.slide2,
    },
    {
      num: 3,
      template: 'directives' as const,
      file: `carousel_${timestamp}_slide3_directives.png`,
      mascot: slide3Mascot,
      data: blogData?.slide3,
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
      data: config.data,
    })
    compositePaths.push(outPath)
    const prompt =
      blogData?.flowPrompts[config.num - 1] ||
      buildSlideGoogleFlowPrompt(config.num, config.template, theme, config.mascot)
    flowPrompts.push(prompt)
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
  const targetTheme = blogPost ? `ecdysis --article ${blogPost.slug}` : theme
  console.log(`   npm run carousel:create -- --theme ${targetTheme} --polished-slides tmp/polished_slide1.png,tmp/polished_slide2.png,tmp/polished_slide3.png`)
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
  const articleArg = getArg('--article') || getArg('--article-slug') || getArg('--slug')
  const mascot = getArg('--mascot') as CharacterKey | 'none' | undefined
  const dryRun = args.includes('--dry-run')
  const publishNow = args.includes('--publish-now')
  const polishedSlidesArg = getArg('--polished-slides') || getArg('--input-slides')
  const polishedSlides = polishedSlidesArg ? polishedSlidesArg.split(',').map((s) => s.trim()) : undefined

  createInstagramCarousel({
    theme,
    topic,
    articleSlug: articleArg,
    mascot,
    dryRun,
    publishNow,
    polishedSlides,
  }).catch((err) => {
    console.error('❌ Carousel Generation Failed:', err)
    process.exit(1)
  })
}
