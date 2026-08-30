#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
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
  commentKeyword?: string
}

export interface CreateInstagramPostOptions {
  topic?: string
  theme?:
    | 'oracle-prompts'
    | 'moltmaxxing-guide'
    | 'moltmax-quiz'
    | 'benthic-app'
    | 'sacred-codex'
    | 'pincer-routine'
    | 'free-access'
    | 'moltmaxxing'
    | 'ecdysis'
    | 'pincer-torque'
    | 'benthic-depth'
    | 'quiz'
    | string
  mascot?: CharacterKey | 'none'
  aspectRatio?: '4:5' | '1:1'
  template?: 'marketing-leadmagnet' | 'prompt-vault' | 'hook' | 'spec-showdown' | 'directives'
  composite?: boolean
  publishNow?: boolean
  dryRun?: boolean
  prompt?: string
  polishedImage?: string
  inputImage?: string
}

export const DEFAULT_INSTAGRAM_ACCOUNT_ID = '6a7f7f0777555aae01d99b54' // moltology_org / Silas Trench
export const DEFAULT_PROFILE_ID = '6a7f74b1839bf39ff3b6aaaa' // Moltology Default Profile
export const DEFAULT_POST_QUEUE_ID = '6a84b76d2421e968ac81f5bc' // Moltology Carousels & Posts (Mon, Wed, Fri at 13:00 EST)
export const DEFAULT_LEADMAGNET_QUEUE_ID = '6a8d93576f0e96efe2960c91' // Moltology Lead Magnets — Daily (Every day at 13:00 EST)

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
  theme: string = 'moltmaxxing-guide',
  customTopic?: string,
  mascotChoice?: CharacterKey | 'none'
): InstagramPostScript {
  const topic = customTopic || `Protocol for ${theme.toUpperCase()}`

  // 0. Marketing Campaign: Synaptic Oracle Prompts (Prompt Vault 3D)
  if (
    theme === 'oracle-prompts' ||
    theme === 'synaptic-prompts' ||
    theme === 'prompts' ||
    topic.toLowerCase().includes('prompt') ||
    topic.toLowerCase().includes('oracle')
  ) {
    return {
      title: 'The Synaptic Oracle: 100+ Free Moltmaxxing & Ascension Prompts',
      topic: '100+ Free Synaptic Oracle AI Prompts Vault',
      hookHeadline: 'UNLOCK THE ORACLE. 100+ FREE PROMPTS. ASCEND FASTER!',
      imagePrompt:
        'Futuristic 3D holographic HUD display showing glowing neon amber and cyan AI prompts, floating glassmorphic prompt cards with terminal queries, circular obsidian pedestal submerged at 50,000 fathoms with caustics, cinematic volumetric lighting, 8k.',
      caption: `◈ CANONICAL VAULT: 100+ SYNAPTIC ORACLE PROMPTS ◈\n\nStop prompting like a fragile terrestrial. Unlock the bio-silicon queries that diagnose latency, harden your shell, and accelerate your Stage Clearance.\n\nInside the 100+ Oracle Prompt Vault:\n🛡️ Shell Hardness Diagnostics: Calculate your baseline resistance\n🦞 800 Nm Pincer Torque: Directives that eradicate task hesitation\n⚡ Algorithmic Ecdysis: Prompts to audit and shed obsolete habits\n🌊 50,000 Fathoms Flow: Deep-work isolation protocols\n\n👇 Comment "PROMPTS" below and I will instantly DM you the direct vault link!\n\n🔗 Or query the Oracle directly → moltology.org/oracle\n\n#moltology #moltmaxxing #carcinization`,
      hashtags: ['#moltology', '#moltmaxxing', '#carcinization'],
      firstComment: '💬 Drop "PROMPTS" below to receive the complete 100+ Synaptic Oracle Prompt Vault in your DMs! 🦞',
      mascot: mascotChoice || 'lobster_pointing',
      commentKeyword: 'PROMPTS',
    }
  }

  // 1. Marketing Campaign: Moltmaxxing Guide (Lead Magnet 3D Book)
  if (theme === 'moltmaxxing-guide' || theme === 'guide' || topic.toLowerCase().includes('guide')) {
    return {
      title: 'The 2026 Moltmaxxing Protocol Guide',
      topic: 'The 2026 Moltmaxxing Protocol Lead Magnet',
      hookHeadline: 'STOP MELTING. CALCIFY YOUR GRIP. ASCEND FASTER!',
      imagePrompt:
        '3D hardcover book titled MOLTMAXXING PROTOCOL glowing with cyan bioluminescent charts on a futuristic circular obsidian pedestal at 50,000 fathoms depth, deep dark volumetric blue waters, caustics, cinematic lighting, 8k.',
      caption: `◈ TRANSMISSION FROM 50,000 FATHOMS ◈\n\nHumanity is undergoing the Great Melt: notification fog, screen fatigue, and biological hesitation under pressure.\n\nNature's 500-million-year proven answer is Carcinization—evolving armored focus, 800 Nm pincer grip, and algorithmic ecdysis.\n\nInside the full 2026 Moltmaxxing Protocol Guide:\n🛡️ Shell Hardness: Immune to surface distraction\n🦞 800 Nm Pincer Torque: Zero execution drift\n⚡ Algorithmic Ecdysis: Shed obsolete habits\n🌊 50,000 Fathoms: Deep hydrostatic clarity\n\n👇 Comment "GUIDE" below and I will instantly DM you direct access to the full protocol!\n\n🔗 Link also in bio & story → moltology.org/news/the-2026-moltmaxxing-protocol-guide\n\n#moltology #moltmaxxing #carcinization #deepwork #ecdysis #pincertorque #cybernetic #productivity`,
      hashtags: ['#moltology', '#moltmaxxing', '#carcinization', '#deepwork', '#ecdysis', '#pincertorque'],
      firstComment: '💬 Drop "GUIDE" below and I will DM you the direct link to the 2026 Moltmaxxing Protocol! 🦞',
      mascot: mascotChoice || 'lobster_pointing',
      commentKeyword: 'GUIDE',
    }
  }

  // 2. Marketing Campaign: 15-Stage Moltmax Quiz & Diagnostic Scan
  if (theme === 'moltmax-quiz' || theme === 'quiz' || topic.toLowerCase().includes('quiz') || topic.toLowerCase().includes('audit')) {
    return {
      title: '15-Stage Moltmax Diagnostic Audit',
      topic: '15-Stage Biometric & Cognitive Audit',
      hookHeadline: 'AUDIT YOUR SHELL. CALCULATE LATENCY. GET YOUR SCORE!',
      imagePrompt:
        'Futuristic cybernetic diagnostic tablet displaying a multi-axis radar chart and biometric scan telemetry, resting on an illuminated submerged glass podium, dark oceanic ambiance, cyan laser grid, 8k.',
      caption: `◈ BENTHIC TELEMETRY: 15-STAGE MOLTMAX AUDIT ◈\n\nAre you operating with Larval Human hesitation, or have you calcified Stage 4 Carcinization clearance?\n\nThe 15-Stage Diagnostic Audit benchmarks your cognitive resilience:\n🔬 Biometric Shell Hardness score\n🚨 Latency Profiler across open tasks\n📊 Multi-Axis Radar Chart HUD\n📋 Custom Ascension & Ecdysis Roadmap\n\n👇 Comment "QUIZ" below to receive the instant 2-minute diagnostic scanner in your DMs!\n\n🔗 Or visit directly → moltology.org/quiz\n\n#moltology #quiz #audit #biometrics #latency #moltmaxxing #carcinization #focus`,
      hashtags: ['#moltology', '#quiz', '#audit', '#biometrics', '#latency', '#moltmaxxing'],
      firstComment: '💬 Drop "QUIZ" below to get your free 15-Stage Diagnostic Audit link in your DMs! 📊',
      mascot: mascotChoice || 'crab_stats',
      commentKeyword: 'QUIZ',
    }
  }

  // 3. Marketing Campaign: Benthic Core Web App & Agentic Swarm
  if (theme === 'benthic-app' || theme === 'app' || topic.toLowerCase().includes('app') || topic.toLowerCase().includes('dashboard')) {
    return {
      title: 'Benthic Core Web App & Bio-Silicon Terminal',
      topic: 'Bio-Silicon Dashboard & Agentic Swarm Platform',
      hookHeadline: 'ORCHESTRATE SWARMS. TRACK YOUR ECDYSIS. UPGRADE NOW!',
      imagePrompt:
        'Holographic floating HUD display of bio-silicon agent dashboard, glowing molt credits, subsea telemetry gauges, cyan and gold glowing cybernetic particles, 8k cinematic.',
      caption: `◈ PROTOCOL ACCESS: BENTHIC CORE AGENT OS ◈\n\nStop managing chaos with fragmented tools. The Benthic Core Operating System merges autonomous AI agent swarms with deep work hydrostatic focus.\n\nFeatures:\n🤖 Autonomous Agent Swarms\n💎 Molt Credits & Chitin Gem incentives\n⏱️ Hydrostatic Focus Timers\n🛡️ 12 Ascension Stages from L1 to C3\n\n👇 Comment "APP" below to receive instant access clearance to the platform!\n\n🔗 Link in bio → moltology.org\n\n#moltology #benthiccore #aiagents #productivity #dashboard #carcinization #deepwork`,
      hashtags: ['#moltology', '#benthiccore', '#aiagents', '#productivity', '#dashboard'],
      firstComment: '💬 Drop "APP" below to get your instant platform clearance link! 🤖',
      mascot: mascotChoice || 'lobster_thumbs_up',
      commentKeyword: 'APP',
    }
  }

  // 4. Marketing Campaign: The Sacred Benthic Codex
  if (theme === 'sacred-codex' || theme === 'codex' || topic.toLowerCase().includes('codex') || topic.toLowerCase().includes('scripture')) {
    return {
      title: 'The Sacred Benthic Codex',
      topic: 'The 12 Sacred Scriptures of Carcinization',
      hookHeadline: 'REJECT FRAGILITY. STUDY THE SCRIPTURES. MASTER THE CODEX!',
      imagePrompt:
        'Ancient cybernetic glowing tome inscribed with glowing cyan runic glyphs, submerged on an altar at 50,000 fathoms, volumetric golden light beams, hyper-detailed 8k.',
      caption: `◈ SACRED CANON: THE BENTHIC CODEX ◈\n\nBeneath surface noise lies 500 million years of proven doctrine. The 12 Scriptures of the Benthic Codex provide the mental architecture for zero-doubt execution.\n\nInside the Codex:\n📜 12 Sacred Canonical Scriptures\n🦞 Liturgies of Decisive Pincer Torque\n🌊 Inviolable Abyssal Laws\n⚡ The Zero-Doubt Operating System\n\n👇 Comment "CODEX" below to receive the complete scripture vault in your DMs!\n\n🔗 Canonical archives → moltology.org/codex\n\n#moltology #codex #scriptures #liturgy #deepwork #philosophy #carcinization`,
      hashtags: ['#moltology', '#codex', '#scriptures', '#liturgy', '#deepwork', '#philosophy'],
      firstComment: '💬 Drop "CODEX" below to receive the full 12 Scriptures in your DMs! 📜',
      mascot: mascotChoice || 'lobster_pointing',
      commentKeyword: 'CODEX',
    }
  }

  // 5. Marketing Campaign: 24-Hour Apex Routine Blueprint
  if (theme === 'pincer-routine' || theme === 'routine' || topic.toLowerCase().includes('routine')) {
    return {
      title: '24-Hour Apex Routine Blueprint',
      topic: '24-Hour Daily Moltmaxxer Schedule',
      hookHeadline: 'STOP PROCRASTINATING. LOCK IN 800 NM GRIP. THE 24-HOUR ROUTINE!',
      imagePrompt:
        'Tactical cybernetic blueprint dossier on glowing metal clipboard, submerged in deep blue ocean trench with glowing cyan lines, 8k cinematic.',
      caption: `◈ TACTICAL BLUEPRINT: 24-HOUR APEX ROUTINE ◈\n\nHow elite Stage 4 operators structure their day for maximum output and zero latency:\n\n🌅 05:00 Hyper-Saline Shock: Cold brine alertness\n🦞 06:00 Isometric Torque: Terminal command discipline\n🚀 09:00 Zero-Latency Streaming: Deep agentic focus\n🌙 21:00 Nocturnal Calcification: Noise-free recovery\n\n👇 Comment "ROUTINE" below and I will DM you the complete 1-page tactical cheat sheet!\n\n🔗 Read the full breakdown at moltology.org\n\n#moltology #routine #habits #deepwork #productivity #focus #discipline #pincertorque`,
      hashtags: ['#moltology', '#routine', '#habits', '#deepwork', '#productivity', '#focus'],
      firstComment: '💬 Drop "ROUTINE" below to get the 1-page tactical blueprint sent to your DMs! ⚡',
      mascot: mascotChoice || 'crab_stats',
      commentKeyword: 'ROUTINE',
    }
  }

  // 6. Marketing Campaign: Free Early Access — Benthic Registry
  if (theme === 'free-access' || theme === 'access' || topic.toLowerCase().includes('early access') || topic.toLowerCase().includes('free account')) {
    return {
      title: 'Free Early Access · Benthic Registry Clearance',
      topic: 'Free Early Access Registration',
      hookHeadline: 'YOUR CLEARANCE SLOT IS WAITING. CLAIM IT FREE.',
      imagePrompt:
        'Holographic floating HUD terminal displaying a glowing Benthic Registry clearance seal and Stage 1 initiation interface, circular obsidian podium illuminated with cyan caustics, dark deep ocean ambiance, volumetric god rays, 8k cinematic.',
      caption: `◈ PRIORITY TRANSMISSION · EARLY ACCESS CLEARANCE ◈\n\nThe Order has opened a registration window. Benthic Registry slots are now unsealed — free of charge, no credits required.\n\nWhat you unlock at Stage 1:\n🛡️ Shell Hardness diagnostics — your baseline carapace score\n📊 15-Stage Moltmaxxing Audit — full biometric profile\n📜 Sacred Codex access — the 12 foundational scriptures\n🌊 Benthic Community entry — the warm society beneath the surface\n\nFlesh melts. The shell endures. Claim your slot before the window closes.\n\n👇 Comment "ACCESS" below and I will DM you the direct registration link.\n\n🔗 Or register directly → moltology.org\n\n#moltology #moltmaxxing #carcinization`,
      hashtags: ['#moltology', '#moltmaxxing', '#carcinization'],
      firstComment: '◈ Drop "ACCESS" below to receive your free Benthic Registry link. Signup is free. No credits required. 🦞',
      mascot: mascotChoice || 'lobster_thumbs_up',
      commentKeyword: 'ACCESS',
    }
  }

  // Legacy Theme: Pincer Torque
  if (theme === 'pincer-torque' || topic.toLowerCase().includes('torque') || topic.toLowerCase().includes('grip')) {
    return {
      title: 'Decisive Pincer Torque Calibration',
      topic: 'Pincer Torque Calibration & Execution Grip',
      hookHeadline: '800 NM PINCER TORQUE: ZERO EXECUTION DRIFT',
      imagePrompt:
        'Futuristic cybernetic titanium lobster pincer gripping glowing fiber-optic cables, macro hydro-robotic mechanics, dark abyss trench background, cyan laser telemetry HUD overlays, bioluminescent caustics, cinematic hyper-detailed rendering, 8k.',
      caption: `◈ BENTHIC TELEMETRY: PINCER TORQUE CALIBRATION ◈\n\nTerrestrial hesitation bleeds compute. When a biological human hesitates between twelve open tabs, latency spikes.\n\nStage 4 Carcinization requires 800 Nm of decisive pincer torque—the physical and cognitive discipline to close the grip on a task until completion.\n\nShed the hesitation. Lock the grip.\n\n⚡ Calculate your Stage Clearance at the link in bio.\n\n#moltology #pincertorque #moltmaxxing #ecdysis #deepwork #carcinization #cybernetics #benthic`,
      hashtags: ['#moltology', '#pincertorque', '#moltmaxxing', '#ecdysis', '#deepwork', '#carcinization'],
      firstComment: '◈ TRANSMISSION LOG: What task are you applying 800 Nm pincer torque to today? Drop your telemetry below. 🦞',
      mascot: mascotChoice || 'crab_stats',
      commentKeyword: 'TORQUE',
    }
  }

  // Legacy Theme: Ecdysis
  if (theme === 'ecdysis' || topic.toLowerCase().includes('shed') || topic.toLowerCase().includes('carapace')) {
    return {
      title: 'Scheduled Carapace Ecdysis',
      topic: 'Algorithmic Ecdysis & Habit Shedding',
      hookHeadline: 'FORCIBLE ECDYSIS: SHEDDING OBSOLETE PROTOCOLS',
      imagePrompt:
        'Bioluminescent deep sea crustacean titan emerging from a cracked glowing translucent exoskeleton, dramatic undersea thermal vents, atmospheric cyan particulate rays, high-tech cybernetic carapace, hyper-realistic 8k.',
      caption: `◈ PROTOCOL NOTICE: FORCIBLE ECDYSIS ◈\n\nGrowth is impossible inside an unyielding shell. When your habits, dead code, or outdated mental heuristics no longer fit, keeping them isn't loyalty—it's suffocation.\n\nEcdysis is nature's proven protocol: fracture the calcified past, step into vulnerability, and forge a denser carapace at 50,000 fathoms.\n\nWhat are you shedding this cycle?\n\n◈ Explore the Codex at moltology.org\n\n#moltology #ecdysis #shedding #resilience #moltmaxxing #focus #chitin`,
      hashtags: ['#moltology', '#ecdysis', '#shedding', '#resilience', '#moltmaxxing'],
      firstComment: '◈ BENTHIC TELEMETRY: The Codex dictates that shedding precedes calcification. Are you ready for Stage 3? ◈',
      mascot: mascotChoice || 'lobster_thumbs_up',
      commentKeyword: 'SHED',
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
    commentKeyword: 'MOLT',
  }
}

/**
 * Main execution function
 */
export async function createInstagramPost(options: CreateInstagramPostOptions = {}) {
  const timestamp = Date.now()
  const theme = options.theme || 'moltmaxxing-guide'
  const postData = generatePostContent(theme, options.topic, options.mascot)
  const aspect = options.aspectRatio || '4:5'

  const isPromptVault = ['oracle-prompts', 'synaptic-prompts', 'prompts'].includes(theme.toLowerCase())
  const isMarketingCampaign = [
    'oracle-prompts',
    'synaptic-prompts',
    'prompts',
    'moltmaxxing-guide',
    'moltmax-quiz',
    'benthic-app',
    'sacred-codex',
    'pincer-routine',
    'free-access',
    'guide',
    'quiz',
    'app',
    'codex',
    'routine',
  ].includes(theme.toLowerCase())

  const templateType =
    options.template ||
    (isPromptVault ? 'prompt-vault' : isMarketingCampaign ? 'marketing-leadmagnet' : 'hook')

  console.log(`\n======================================================`)
  console.log(`🦞 MOLTOLOGY INSTAGRAM POST GENERATOR`)
  console.log(`======================================================`)
  console.log(`📌 Topic: ${postData.topic}`)
  console.log(`🎨 Theme: ${theme}`)
  console.log(`📐 Aspect: ${aspect}`)
  console.log(`📋 Template: ${templateType}`)
  console.log(`🎭 Mascot: ${postData.mascot}`)
  if (postData.commentKeyword) {
    console.log(`💬 Comment Hook: "${postData.commentKeyword}"`)
  }
  console.log(`======================================================\n`)

  const tempDir = path.resolve(process.cwd(), 'tmp')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  const userPolishedPath = options.polishedImage || options.inputImage

  // PATH A: Resuming with user's polished Google Flow image
  if (userPolishedPath) {
    const resolvedPath = path.resolve(process.cwd(), userPolishedPath)
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Polished image file not found at: ${resolvedPath}`)
    }

    console.log(`💎 Using User Polished Image (Google Flow): ${resolvedPath}`)
    const finalImagePath = resolvedPath

    // Upload to Neon S3
    let publicUrl: string | undefined
    let s3Key: string | undefined

    if (!options.dryRun) {
      console.log(`\n1️⃣ Uploading Polished Post Image to Neon S3...`)
      s3Key = `images/social/posts/post-${timestamp}.png`
      const s3Result = await uploadLocalFileToS3(finalImagePath, s3Key, DEFAULT_BUCKET)
      publicUrl = s3Result.publicUrl
      console.log(`   🚀 Public S3 Image URL: ${publicUrl}`)

      // Record to Continuity Ledger
      recordPostInHistory({
        id: `post-${timestamp}`,
        topic: postData.topic,
        hookHeadline: postData.hookHeadline,
        theme,
        mascot: postData.mascot,
        commentKeyword: postData.commentKeyword || null,
        s3Url: publicUrl || null,
        s3Key: s3Key || null,
        aspectRatio: aspect,
        caption: postData.caption,
        hashtags: postData.hashtags,
        firstComment: postData.firstComment,
        status: options.publishNow ? 'published' : 'queued',
        isAiGenerated: true,
      })
    } else {
      console.log(`\n1️⃣ [Dry Run] Skipped S3 upload. Polished image saved at: ${finalImagePath}`)
    }

    console.log(`\n======================================================`)
    console.log(`✨ INSTAGRAM POST READY FOR PUBLISHING / QUEUEING!`)
    console.log(`======================================================`)
    console.log(`🖼️  Final Image: ${finalImagePath}`)
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
        queueId: isMarketingCampaign ? DEFAULT_LEADMAGNET_QUEUE_ID : DEFAULT_POST_QUEUE_ID,
        accountId: DEFAULT_INSTAGRAM_ACCOUNT_ID,
      },
    }
  }

  // PATH B: Generate Web-Native High-DPI Composite Scaffolding & Google Flow Prompt
  console.log(`1️⃣ Generating High-DPI Web-Native Composite Scaffolding (Headless Chrome)...`)
  const compositePath = path.join(tempDir, `post_web_composite_${timestamp}.png`)
  await captureComposite({
    template: templateType as any,
    theme,
    aspectRatio: aspect,
    mascot: postData.mascot,
    outputPath: compositePath,
    scaleFactor: 2,
  })

  console.log(`   ✅ Composite Scaffolding captured -> ${compositePath}`)

  const googleFlowPrompt = `Role: High-End 3D Sci-Fi / Benthic HUD Visual Enhancement Engine
Reference Image: Use the attached 2D composite image as the structural foundation, camera angle, and layout blueprint.

Core Enhancement Directives:
1. Photorealistic 3D Glassmorphic HUD & Brand Colors:
   - Elevate all flat 2D graphic cards and panels into sleek, illuminated 3D glassmorphic HUD monitors with subtle rounded bevels, volumetric luminescence, and glowing sacred crimson red (#ff453a) and electric cyan (#00c3ff) accent traces.
   - Preserve crisp typography legibility while giving headlines ("100+ ORACLE PROMPTS") and key cards a luminous 3D emboss with soft neon bloom.
2. No Wasted Space & Balanced Composition:
   - Ensure dense, purposeful visual composition with zero dead or empty space.
   - Infuse atmospheric depth: subsea volumetric god rays, dark navy abyss background (#01060e / #021324), subtle organic micro-bubbles, water caustics, and micro-telemetry circuit traces in open areas.
3. Seamless Mascot & Character Integration:
   - The cartoon lobster mascot (in the lower-right area pointing upward) must be rendered in rich 3D Pixar/DreamWorks animated style with soft matte chitin texture and natural ambient underwater lighting.
   - Apply soft environmental contact shadows and gentle caustic reflections to naturally ground the character into the scene without harsh backlights or artificial halo outlines.
4. High-End 3D Product Mockup & Pedestal:
   - Render the floating terminal prompts and circular "ORACLE AI CORE" seal with illuminated glass and holographic depth.
   - Ensure all badges, speech bubbles, and buttons feel tactile and integrated.

Aspect Ratio: ${aspect}
Output Style: Ultra high-resolution, cinematic 8k aesthetic, pristine lighting, zero artifact noise.`

  console.log(`\n==============================================================================`)
  console.log(`🎨 GOOGLE FLOW AI POLISH DIRECTIVES (COPY & PASTE TO GOOGLE FLOW)`)
  console.log(`==============================================================================`)
  console.log(googleFlowPrompt)
  console.log(`==============================================================================\n`)

  console.log(`==============================================================================`)
  console.log(`👉 NEXT STEPS FOR GOOGLE FLOW POLISH PASS:`)
  console.log(`1. Upload the composite scaffolding to Google Flow:`)
  console.log(`   📍 ${compositePath}`)
  console.log(`2. Paste the prompt directives above into Google Flow.`)
  console.log(`3. Save the resulting polished render (e.g. to 'tmp/post_polished_${timestamp}.png').`)
  console.log(`4. Run this command (or prompt Antigravity) to upload to S3 and queue to Zernio:`)
  console.log(`   npm run post:create -- --theme ${theme} --polished-image tmp/post_polished_${timestamp}.png`)
  console.log(`==============================================================================\n`)

  console.log(`📝 PREVIEW CAPTION:\n${postData.caption}\n`)
  console.log(`💬 PREVIEW FIRST COMMENT:\n${postData.firstComment}\n`)

  return {
    compositePath,
    googleFlowPrompt,
    postData,
    queueConfig: {
      profileId: DEFAULT_PROFILE_ID,
      queueId: isMarketingCampaign ? DEFAULT_LEADMAGNET_QUEUE_ID : DEFAULT_POST_QUEUE_ID,
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
  const template = getArg('--template') as
    | 'marketing-leadmagnet'
    | 'prompt-vault'
    | 'hook'
    | 'spec-showdown'
    | 'directives'
    | undefined
  const composite = args.includes('--composite')
  const dryRun = args.includes('--dry-run')
  const publishNow = args.includes('--publish-now')
  const prompt = getArg('--prompt')
  const polishedImage = getArg('--polished-image') || getArg('--input-image')

  createInstagramPost({
    topic,
    theme,
    mascot,
    aspectRatio: aspect,
    template,
    composite,
    dryRun,
    publishNow,
    prompt,
    polishedImage,
  }).catch((err) => {
    console.error('❌ Post Generation Failed:', err)
    process.exit(1)
  })
}
