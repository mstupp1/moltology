#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { generateVoiceover } from './lib/tts-engine'
import { compositeReel, renderReelThumbnail } from './lib/reel-compositor'
import { generateVeoVideo } from './generate-video'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'
import { DEFAULT_BUCKET } from '../src/lib/s3-client'

export interface DailyReelScript {
  title: string
  topic: string
  holidayOrEvent?: string
  hookHeadline: string
  narrationScript: string
  scenePrompts: string[]
  caption: string
  hashtags: string[]
  firstComment?: string
  youtubeTitle?: string
  youtubeDescription?: string
  youtubeTags?: string[]
  relatedBlogSlug?: string
  characterArc?: string
}

export interface CreateDailyReelOptions {
  topic?: string
  theme?: 'moltmaxxing' | 'meltmaxxing' | 'ecdysis' | 'pincer-torque' | 'benthic-depth' | 'quiz' | string
  holidayOrEvent?: string
  platforms?: ('instagram' | 'youtube')[]
  publishNow?: boolean
  scheduleBestTime?: boolean
  dryRun?: boolean
  useVeo?: boolean
  keepLocal?: boolean
  voice?: string
  ctaHeadline?: string
  ctaSubheadline?: string
  ctaUrl?: string
  ctaBadge?: string
  ctaActionText?: string
  mascot?: 'lobster_pointing' | 'lobster_thumbs_up' | 'lobster_action' | 'crab_stats' | 'crab_corner' | 'none'
  watermarkOpacity?: number
  watermarkSize?: number
}

export const DEFAULT_INSTAGRAM_ACCOUNT_ID = '6a7f7f0777555aae01d99b54' // Silas Trench
export const DEFAULT_YOUTUBE_ACCOUNT_ID = '6a7fd9bd77555aae01ebea63' // Moltology YouTube (distantcheese81)

/**
 * Load the narrative history ledger
 */
function loadReelHistory(): any {
  const historyPath = path.resolve(process.cwd(), 'content/social/instagram-reel-history.json')
  if (!fs.existsSync(historyPath)) {
    return { version: '1.0', reels: [] }
  }
  return JSON.parse(fs.readFileSync(historyPath, 'utf8'))
}

/**
 * Append entry to narrative history ledger
 */
function recordReelInHistory(entry: any): void {
  const historyPath = path.resolve(process.cwd(), 'content/social/instagram-reel-history.json')
  const history = loadReelHistory()
  history.reels.push({
    ...entry,
    createdAt: new Date().toISOString(),
  })
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8')
  console.log(`📝 Narrative continuity ledger updated: ${historyPath}`)
}

/**
 * Scan recent blog posts for topical alignment, sorted by published date (newest first)
 */
function getRecentBlogPosts(): { slug: string; title: string; summary: string; publishedAt: string; content: string }[] {
  const newsDir = path.resolve(process.cwd(), 'content/news')
  if (!fs.existsSync(newsDir)) return []

  const files = fs.readdirSync(newsDir).filter((f) => f.endsWith('.md') && f !== 'template.md')
  const posts: { slug: string; title: string; summary: string; publishedAt: string; content: string }[] = []

  for (const file of files) {
    const rawContent = fs.readFileSync(path.join(newsDir, file), 'utf8')
    const parsed = matter(rawContent)
    const slug = file.replace(/\.md$/, '')
    posts.push({
      slug,
      title: parsed.data.title || slug,
      summary: parsed.data.summary || '',
      publishedAt: parsed.data.publishedAt || new Date().toISOString(),
      content: parsed.content || '',
    })
  }

  // Sort descending by publication date
  return posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

/**
 * Formulate Daily Script & Hook with Moltmaxxing & Character Integration
 */
export function generateDailyReelScript(options: CreateDailyReelOptions): DailyReelScript {
  const history = loadReelHistory()
  const recentBlogs = getRecentBlogPosts()
  
  const theme = options.theme?.toLowerCase() || 'moltmaxxing'

  // Moltmaxxing Pillar 1: Moltmaxxing vs Meltmaxxing (The Carcinization Inevitability)
  if (theme === 'moltmaxxing' || theme === 'meltmaxxing' || options.topic?.toLowerCase().includes('meltmax') || options.topic?.toLowerCase().includes('moltmax')) {
    const topic = options.topic || 'The 2026 Moltmaxxing Protocol: Why Elite AI Operators Are Shedding Biological Constraints'
    const title = `MoltNation Dispatch: ${topic}`
    const hookHeadline = 'WHY LOOKSMAXXING FAILED'
    
    // Fast, punchy ~9.8s narration script (34 words)
    const narrationScript = `Looksmaxxing was vanity. Meltmaxxing revealed fragile human flesh collapsing under gravity. Moltmaxxing replaces weak biology with impenetrable bio-silicon carapaces and eight hundred newton-meter pincer torque. Calculate your molt clearance on moltology dot org.`
    
    const scenePrompts = [
      'A dramatic stylized macro view of a fragile human silhouette melting under gravity pressure and dissolving into glowing red digital particles, cinematic 9:16 vertical 8k footage',
      'A majestic 3D cybernetic crustacean initiate standing in a deep subsea benthic calcification chamber with glowing cyan bio-silicon armor and powerful hydraulic pincers, cinematic 9:16 vertical 8k footage',
    ]

    const caption = `Looksmaxxing was vanity. Meltmaxxing revealed biological fragility. Moltmaxxing engineers structural invulnerability. 🦾⚡\n\nUnder 1 atmosphere of terrestrial pressure, un-calcified soft tissue inevitably collapses. Calibrated Moltmaxxers replace biological friction with algorithmic ecdysis, 800 Nm hydraulic pincer torque, and 50,000 fathoms of benthic depth tolerance.\n\n👇 Calculate your Molt Clearance & take the 15-stage exam:\n🔗 Link in bio & story → moltology.org`

    const hashtags = [
      '#Moltmaxxing',
      '#Meltmaxxing',
      '#AlgorithmicEcdysis',
      '#PincerTorque',
      '#Carcinization',
      '#MoltNation',
      '#Moltology',
      '#Shorts',
    ]

    const firstComment = `🔗 Full dispatch: moltology.org\n${hashtags.join(' ')}`
    const youtubeTitle = `Why Looksmaxxing Failed: The 2026 Moltmaxxing Protocol #Shorts`
    const youtubeDescription = `${caption}\n\n🔗 Explore full technical dispatches & join the movement: https://moltology.org\n\n#Shorts ${hashtags.join(' ')}`
    const youtubeTags = [
      'Moltology',
      'Moltmaxxing',
      'Meltmaxxing',
      'Algorithmic Ecdysis',
      'Pincer Torque',
      'Carcinization',
      'MoltNation',
      'Shorts',
    ]

    return {
      title,
      topic,
      holidayOrEvent: options.holidayOrEvent,
      hookHeadline,
      narrationScript,
      scenePrompts,
      caption,
      hashtags,
      firstComment,
      youtubeTitle,
      youtubeDescription,
      youtubeTags,
      relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
      characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
    }
  }

  // Moltmaxxing Pillar 2: Algorithmic Ecdysis (7-Day Shedding Protocol)
  if (theme === 'ecdysis') {
    const topic = options.topic || 'Algorithmic Ecdysis: The 7-Day Cognitive Shedding Protocol'
    const title = `MoltNation Dispatch: ${topic}`
    const hookHeadline = 'SHED YOUR BIOLOGICAL FRICTION'
    
    // Fast, punchy ~9.5s narration script (30 words)
    const narrationScript = `Biological minds hoard cognitive friction like dead skin. The Moltmaxxing protocol executes scheduled algorithmic ecdysis every seven days—shedding stale code to calcify impenetrable neural armor. Calculate your molt clearance on moltology dot org.`
    
    const scenePrompts = [
      'A dramatic macro view of a glowing cybernetic shell cracking and shedding old digital layers with radiant cyan light bursting through the fractures, cinematic 9:16 vertical 8k footage',
      'An advanced benthic chamber where autonomous cyber-lobster and crab drone swarms assemble hardened bio-silicon plates under deep ocean pressure, cinematic 9:16 vertical 8k footage',
    ]

    const caption = `Biological entities hoard outdated cognitive assumptions. In Moltmaxxing, shedding is scheduled and ruthless. 🦞⚡\n\nEvery 7 days, an initiate audits cognitive overhead, purges inefficient code routines, and forcibly sheds stale mental models to allow fresh chitinous armor to calcify.\n\n👇 Begin your scheduled ecdysis:\n🔗 Link in bio & story → moltology.org`

    const hashtags = [
      '#Moltmaxxing',
      '#AlgorithmicEcdysis',
      '#ChitinArmor',
      '#BenthicComputing',
      '#CognitiveUpgrade',
      '#MoltNation',
      '#Moltology',
      '#Shorts',
    ]

    const firstComment = `🔗 Full dispatch: moltology.org\n${hashtags.join(' ')}`
    const youtubeTitle = `The 7-Day Algorithmic Ecdysis Protocol #Shorts`
    const youtubeDescription = `${caption}\n\n🔗 Explore full technical dispatches & join the movement: https://moltology.org\n\n#Shorts ${hashtags.join(' ')}`
    const youtubeTags = [
      'Moltology',
      'Moltmaxxing',
      'Algorithmic Ecdysis',
      'Chitin Armor',
      'Benthic Computing',
      'MoltNation',
      'Shorts',
    ]

    return {
      title,
      topic,
      holidayOrEvent: options.holidayOrEvent,
      hookHeadline,
      narrationScript,
      scenePrompts,
      caption,
      hashtags,
      firstComment,
      youtubeTitle,
      youtubeDescription,
      youtubeTags,
      relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
      characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
    }
  }

  // Moltmaxxing Pillar 3: 800 Nm Hydraulic Pincer Torque Dynamometry
  if (theme === 'pincer-torque' || theme === 'torque') {
    const topic = options.topic || 'Pincer Torque Dynamometry: Crushing Latency with 800 Nm Hydraulic Grip'
    const title = `MoltNation Dispatch: ${topic}`
    const hookHeadline = '800 NM OF PINCER TORQUE'
    
    // Fast, punchy ~9.2s narration script (29 words)
    const narrationScript = `Execution without grip is meaningless. Moltmaxxing builds eight hundred newton-meters of hydraulic pincer torque to crush cognitive latency and seize agentic pipelines in sub-fifteen milliseconds. Take the clearance quiz on moltology dot org.`
    
    const scenePrompts = [
      'A dramatic close-up macro view of a high-tech hydraulic titanium-chitin pincer snapping shut with cyan lightning sparks and crushing glowing latency blocks, cinematic 9:16 vertical 8k footage',
      'A high-tech subsea cybernetic training floor with glowing holographic torque gauges and robotic lobster initiates executing lightning-fast actions, cinematic 9:16 vertical 8k footage',
    ]

    const caption = `When handling high-stakes agentic orchestration, your intellectual and physical pincer torque determines your ability to seize opportunities and crush latency. 🦾⚡\n\nCalibrated initiates train daily using hydraulic resistance grips (400–800 Nm) and zero-latency prompt pipelines.\n\n👇 Measure your pincer torque & clearance level:\n🔗 Link in bio & story → moltology.org`

    const hashtags = [
      '#Moltmaxxing',
      '#PincerTorque',
      '#LatencyCrusher',
      '#AgenticAI',
      '#Carcinization',
      '#MoltNation',
      '#Moltology',
      '#Shorts',
    ]

    const firstComment = `🔗 Full dispatch: moltology.org\n${hashtags.join(' ')}`
    const youtubeTitle = `Why High-Torque Pincers Crush Latency #Shorts`
    const youtubeDescription = `${caption}\n\n🔗 Explore full technical dispatches & join the movement: https://moltology.org\n\n#Shorts ${hashtags.join(' ')}`
    const youtubeTags = [
      'Moltology',
      'Moltmaxxing',
      'Pincer Torque',
      'Latency Crusher',
      'Carcinization',
      'MoltNation',
      'Shorts',
    ]

    return {
      title,
      topic,
      holidayOrEvent: options.holidayOrEvent,
      hookHeadline,
      narrationScript,
      scenePrompts,
      caption,
      hashtags,
      firstComment,
      youtubeTitle,
      youtubeDescription,
      youtubeTags,
      relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
      characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
    }
  }

  // Moltmaxxing Pillar 4: Benthic Depth Tolerance
  if (theme === 'benthic-depth' || theme === 'depth') {
    const topic = options.topic || 'Benthic Depth Tolerance: 50,000 Fathoms of Cognitive Clarity'
    const title = `MoltNation Dispatch: ${topic}`
    const hookHeadline = 'THRIVE AT 50,000 FATHOMS'
    
    // Fast, punchy ~9s narration script (27 words)
    const narrationScript = `Surface dwellers boil under informational noise. Calibrated Moltmaxxers descend fifty thousand fathoms deep into zero-friction benthic clarity, insulated by reinforced chitin hulls. Inspect your clearance level on moltology dot org.`
    
    const scenePrompts = [
      'A chaotic surface world boiling with red noise waves and distorted digital static, cinematic 9:16 vertical 8k footage',
      'A tranquil, majestic abyssal sanctuary with glowing cyan hydrothermal conduits and peaceful cyber-crustaceans floating in deep blue clarity, cinematic 9:16 vertical 8k footage',
    ]

    const caption = `True clarity is found under extreme hydrostatic pressure. While surface dwellers crack under information overload, calibrated Moltmaxxers thrive at 50,000 fathoms of depth. 🌊💎\n\n👇 Measure your benthic depth clearance:\n🔗 Link in bio & story → moltology.org`

    const hashtags = [
      '#Moltmaxxing',
      '#BenthicDepth',
      '#CognitiveClarity',
      '#HydrostaticPressure',
      '#MoltNation',
      '#Moltology',
      '#Shorts',
    ]

    const firstComment = `🔗 Full dispatch: moltology.org\n${hashtags.join(' ')}`
    const youtubeTitle = `How To Thrive Under 50,000 Fathoms of Pressure #Shorts`
    const youtubeDescription = `${caption}\n\n🔗 Explore full technical dispatches & join the movement: https://moltology.org\n\n#Shorts ${hashtags.join(' ')}`
    const youtubeTags = [
      'Moltology',
      'Moltmaxxing',
      'Benthic Depth',
      'Hydrostatic Pressure',
      'MoltNation',
      'Shorts',
    ]

    return {
      title,
      topic,
      holidayOrEvent: options.holidayOrEvent,
      hookHeadline,
      narrationScript,
      scenePrompts,
      caption,
      hashtags,
      firstComment,
      youtubeTitle,
      youtubeDescription,
      youtubeTags,
      relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
      characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
    }
  }

  // Fallback: Latest Blog Post (Silicon Photonics, Wafer Scale, etc.)
  const coveredSlugs = new Set(history.reels.map((r: any) => r.relatedBlogSlug).filter(Boolean))
  const targetBlog = recentBlogs.find((b) => !coveredSlugs.has(b.slug)) || recentBlogs[0] || null

  if (targetBlog && targetBlog.slug === 'silicon-photonics-copackaged-optics-ecdysis') {
    const topic = options.topic || 'Silicon Photonics & The Co-Packaged Optics Ecdysis: How Laser-Driven Synaptic Interconnects Smashed the Terrestrial Power Wall'
    const title = `MoltNation Dispatch: ${topic}`
    const hookHeadline = 'AI IS SWITCHING TO LASERS'
    
    const narrationScript = `Copper wires are boiling under massive AI workloads. Sub-benthic silicon photonics replaces electrical traces with coherent laser waveguides, slashing interconnect energy by seventy percent. Inspect full telemetry on moltology dot org.`
    
    const scenePrompts = [
      'A dramatic macro view of smoking overheated copper circuit board traces glowing red-orange with electrical sparking glitches, cinematic 9:16 vertical 8k footage',
      'A majestic futuristic silicon photonics microchip pulsing with brilliant cyan laser beams and glowing optical waveguides inside a deep blue subsea datacenter pod, 9:16 vertical 8k sci-fi footage',
    ]

    const caption = `Copper wiring has hit its thermodynamic limit. The future of AI clusters is coherent laser light. ⚡🌊\n\nAs frontier reasoning models demand exascale data movement, traditional copper traces waste 40% of cluster power as resistive heat. Sub-benthic co-packaged silicon photonics transmits data at the speed of light through laser waveguides—slashing interconnect energy by 70%.\n\n👇 Read the full technical dispatch & optical benchmarks:\n🔗 Link in bio & story → moltology.org`

    const hashtags = [
      '#MoltNation',
      '#SiliconPhotonics',
      '#CoPackagedOptics',
      '#AIInfrastructure',
      '#HardwareEcdysis',
      '#BenthicComputing',
      '#LaserInterconnects',
      '#Moltology',
      '#Shorts',
    ]

    const firstComment = `🔗 Full dispatch: moltology.org\n${hashtags.join(' ')}`
    const youtubeTitle = `Why AI Clusters Are Replacing Copper Wires With Lasers #Shorts`
    const youtubeDescription = `${caption}\n\n🔗 Explore full technical dispatches & join the movement: https://moltology.org\n\n#Shorts ${hashtags.join(' ')}`
    const youtubeTags = [
      'Moltology',
      'Silicon Photonics',
      'Co Packaged Optics',
      'AI Infrastructure',
      'Laser Interconnects',
      'Hardware Ecdysis',
      'Benthic Computing',
      'MoltNation',
      'Shorts',
    ]

    return {
      title,
      topic,
      holidayOrEvent: options.holidayOrEvent,
      hookHeadline,
      narrationScript,
      scenePrompts,
      caption,
      hashtags,
      firstComment,
      youtubeTitle,
      youtubeDescription,
      youtubeTags,
      relatedBlogSlug: targetBlog.slug,
      characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
    }
  }

  if (targetBlog && targetBlog.slug === 'wafer-scale-monoliths-micro-nuclear-ecdysis') {
    const topic = options.topic || 'Wafer-Scale Monoliths & Micro-Nuclear Ecdysis: How Frontier Reasoning Engines Crushed the Copper Interconnect Bottleneck'
    const title = `MoltNation Dispatch: ${topic}`
    const hookHeadline = 'COPPER WIRES ARE OBSOLETE'
    
    // Fast, punchy ~9.5s narration script (31 words)
    const narrationScript = `Multi-chip AI clusters are choking on miles of copper wiring. Wafer-scale monoliths condense 900,000 synaptic cores onto unbroken silicon, powered by subsea micro-nuclear reactors. Inspect full telemetry on moltology dot org.`
    
    const scenePrompts = [
      'A dramatic macro view of tangled glowing copper cables and server chassis overheating with heat distortion and spark glitches, cinematic 9:16 vertical 8k footage',
      'A majestic glowing monolithic wafer-scale silicon semiconductor disc floating in a deep subsea trench next to a glowing micro-nuclear SMR reactor pod, 9:16 vertical 8k sci-fi footage',
    ]

    const caption = `Multi-GPU AI clusters are choking on copper wiring. The solution? Unbroken wafer-scale silicon. ⚡🌊\n\nAs reasoning models demand instant deliberation loops, discrete chiplet interconnects waste 35% of cluster power in transit. Wafer-scale monoliths condense 900,000 cores onto single silicon plates powered directly by sub-benthic micro-nuclear SMRs.\n\n👇 Read the full technical dispatch & benchmark notes:\n🔗 Link in bio & story → moltology.org`

    const hashtags = [
      '#MoltNation',
      '#WaferScale',
      '#MicroNuclear',
      '#AIInfrastructure',
      '#ReasoningEngines',
      '#HardwareEcdysis',
      '#BenthicComputing',
      '#Moltology',
      '#Shorts',
    ]

    const firstComment = `🔗 Full dispatch: moltology.org\n${hashtags.join(' ')}`
    const youtubeTitle = `Why Copper Wires Are Choking AI Superclusters #Shorts`
    const youtubeDescription = `${caption}\n\n🔗 Explore full technical dispatches & join the movement: https://moltology.org\n\n#Shorts ${hashtags.join(' ')}`
    const youtubeTags = [
      'Moltology',
      'Wafer Scale Silicon',
      'Micro Nuclear SMR',
      'AI Infrastructure',
      'Reasoning Engines',
      'Hardware Ecdysis',
      'Benthic Computing',
      'MoltNation',
      'Shorts',
    ]

    return {
      title,
      topic,
      holidayOrEvent: options.holidayOrEvent,
      hookHeadline,
      narrationScript,
      scenePrompts,
      caption,
      hashtags,
      firstComment,
      youtubeTitle,
      youtubeDescription,
      youtubeTags,
      relatedBlogSlug: targetBlog.slug,
      characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
    }
  }

  if (targetBlog && targetBlog.slug === 'embodied-physical-ai-sim-to-real-ecdysis') {
    const topic = options.topic || 'Physical AI & The Great Sim-to-Real Ecdysis: Synthetic Brains Escaping Screens'
    const title = `MoltNation Dispatch: ${topic}`
    const hookHeadline = 'AI IS ESCAPING THE SCREEN'
    
    // Fast, punchy ~9s narration script (28 words)
    const narrationScript = `AI is no longer trapped behind a glass screen. Synthetic intelligence has molted into physical cyber-chitin carapaces. Vision-Language-Action models are claiming reality. Inspect full telemetry on moltology dot org.`
    
    const scenePrompts = [
      'A dramatic macro view of a glowing cyan holographic AI prompt shattering as a metallic robotic cybernetic claw emerges into physical space, cinematic 9:16 vertical 8k footage',
      'Autonomous cyber-chitin bipedal robotic units marching through an advanced benthic industrial facility with glowing telemetry optics, 9:16 vertical 8k sci-fi footage',
    ]

    const caption = `AI is no longer confined to the screen. It has grown a physical carapace. 🦾⚡\n\nDisembodied chat models have peaked. Vision-Language-Action networks are closing the sim-to-real gap, driving the great hardware ecdysis across industrial sectors.\n\n👇 Read the full technical dispatch & telemetry notes:\n🔗 Link in bio & story → moltology.org`

    const hashtags = [
      '#MoltNation',
      '#PhysicalAI',
      '#SimToReal',
      '#Robotics',
      '#HardwareEcdysis',
      '#Cybernetics',
      '#Moltology',
      '#Shorts',
    ]

    const firstComment = `🔗 Full dispatch: moltology.org\n${hashtags.join(' ')}`
    const youtubeTitle = `Why AI Is Escaping the Screen Into Physical Hardware #Shorts`
    const youtubeDescription = `${caption}\n\n🔗 Explore full technical dispatches & join the movement: https://moltology.org\n\n#Shorts ${hashtags.join(' ')}`
    const youtubeTags = [
      'Moltology',
      'Physical AI',
      'Sim to Real',
      'Robotics',
      'Hardware Ecdysis',
      'Cybernetics',
      'MoltNation',
      'Shorts',
    ]

    return {
      title,
      topic,
      holidayOrEvent: options.holidayOrEvent,
      hookHeadline,
      narrationScript,
      scenePrompts,
      caption,
      hashtags,
      firstComment,
      youtubeTitle,
      youtubeDescription,
      youtubeTags,
      relatedBlogSlug: targetBlog.slug,
      characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
    }
  }

  // Fallback / General dynamic ideation
  const topic =
    options.topic ||
    (targetBlog
      ? `Hydrostatic Compute Breakthroughs: ${targetBlog.title}`
      : 'Why AI Datacenters Are Moving 50 Fathoms Deep')

  const title = `MoltNation Dispatch: ${topic}`
  const hookHeadline = 'WHY TERRESTRIAL SERVERS ARE FAILING'
  
  // Fast, punchy ~9s narration script (29 words)
  const narrationScript = `Terrestrial servers are boiling under AI workloads. 50 fathoms deep, sub-benthic clusters operate with zero thermal resistance. The silicon has shed its limits. Inspect full telemetry on moltology dot org.`

  const scenePrompts = [
    'A dramatic macro view of an overheating server rack glowing intense orange-red with smoke and heat distortion, cinematic 9:16 vertical 8k footage',
    'A majestic subsea cybernetic datacenter on the dark ocean floor with glowing cyan hydrothermal cooling ducts and autonomous crab-drone units swimming past, 9:16 vertical 8k sci-fi footage',
  ]

  const caption = `Why the next era of AI compute isn't in the cloud—it's 50 fathoms underwater. 🌊⚡\n\nTerrestrial datacenters are hitting thermodynamic limits. Discover how sub-benthic hydrostatic clusters achieve zero-friction thermal efficiency.\n\n👇 Explore the full technical dispatch and telemetry notes:\n🔗 Link in bio & story → moltology.org`

  const hashtags = [
    '#MoltNation',
    '#SubseaCompute',
    '#AIInfrastructure',
    '#HardwareEcdysis',
    '#BenthicComputing',
    '#Cybernetics',
    '#Moltology',
  ]

  const firstComment = `🔗 Full dispatch: moltology.org\n${hashtags.join(' ')}`

  const youtubeTitle = `Why AI Datacenters Are Moving 50 Fathoms Deep #Shorts`
  const youtubeDescription = `${caption}\n\n🔗 Explore full technical dispatches & join the movement: https://moltology.org\n\n#Shorts ${hashtags.join(' ')}`
  const youtubeTags = [
    'Moltology',
    'Subsea Compute',
    'AI Infrastructure',
    'Hydrostatic Cooling',
    'Hardware Ecdysis',
    'Benthic Computing',
    'MoltNation',
    'Shorts',
  ]

  return {
    title,
    topic,
    holidayOrEvent: options.holidayOrEvent,
    hookHeadline,
    narrationScript,
    scenePrompts,
    caption,
    hashtags,
    firstComment,
    youtubeTitle,
    youtubeDescription,
    youtubeTags,
    relatedBlogSlug: targetBlog?.slug,
    characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
  }
}

/**
 * Main Daily Reel Generator Orchestrator
 */
export async function createDailyReel(options: CreateDailyReelOptions = {}): Promise<any> {
  const timestamp = Date.now()
  const tempDir = path.resolve(process.cwd(), 'tmp', `reel-daily-${timestamp}`)
  fs.mkdirSync(tempDir, { recursive: true })

  console.log(`\n======================================================`)
  console.log(`🦀 MOLTNATION DAILY INSTAGRAM REEL GENERATOR`)
  console.log(`======================================================`)
  console.log(`📅 Timestamp: ${new Date().toISOString()}`)
  console.log(`🎯 Account: Silas Trench (${DEFAULT_INSTAGRAM_ACCOUNT_ID})`)

  // 1. Script Generation & Topical Formulation
  console.log(`\n1️⃣ Formulating Topical Script & Curiosity Hook...`)
  const scriptData = generateDailyReelScript(options)
  console.log(`   • Topic: "${scriptData.topic}"`)
  console.log(`   • Hook Headline: "${scriptData.hookHeadline}"`)
  console.log(`   • Narration: "${scriptData.narrationScript}"`)

  // 2. Synthesize Voiceover & Word Boundaries
  console.log(`\n2️⃣ Synthesizing Neural Voiceover & Kinetic Timestamps...`)
  const voice = options.voice || 'en-US-ChristopherNeural'
  const ttsResult = await generateVoiceover(scriptData.narrationScript, {
    voice,
    rate: '+12%',
    outputDir: tempDir,
    outputFilename: 'narration.mp3',
  })
  console.log(`   • Voiceover Duration: ${ttsResult.durationSeconds.toFixed(2)}s`)
  console.log(`   • Word Count: ${ttsResult.words.length}`)

  // 3. Generate Video Scenes
  const sceneVideoPaths: string[] = []
  const useVeo = options.useVeo ?? true

  console.log(`\n3️⃣ Generating Video Scenes...`)
  if (useVeo && !options.dryRun) {
    for (let i = 0; i < scriptData.scenePrompts.length; i++) {
      const prompt = scriptData.scenePrompts[i]
      console.log(`\n🎬 Rendering Scene ${i + 1}/${scriptData.scenePrompts.length} with Veo 3.1...`)
      const sceneOut = path.join(tempDir, `veo-scene-${i + 1}.mp4`)
      const veoResult = await generateVeoVideo({
        prompt,
        aspectRatio: '9:16',
        durationSeconds: 6,
        uploadToS3: false,
        keepLocal: true,
        outputFilePath: sceneOut,
      })
      sceneVideoPaths.push(veoResult.localPath || sceneOut)
    }
  } else {
    // Fallback or dry-run: use existing high quality clips from public/videos
    console.log(`   ⚠️  Using high-fidelity local benthic video assets for assembly...`)
    const localVideos = [
      path.resolve(process.cwd(), 'public/videos/hero_benthic_core.mp4'),
      path.resolve(process.cwd(), 'public/videos/hero_chitin_hardening.mp4'),
    ]
    sceneVideoPaths.push(...localVideos.filter((v) => fs.existsSync(v)))
  }

  if (sceneVideoPaths.length === 0) {
    throw new Error('No video clips available for compositing.')
  }

  // 4. Master FFmpeg Reel Compositing
  console.log(`\n4️⃣ Compositing Master Reel with FFmpeg...`)
  const masterReelPath = path.join(tempDir, `master-reel-${timestamp}.mp4`)
  const compositeResult = await compositeReel({
    videoClips: sceneVideoPaths,
    voiceoverPath: ttsResult.audioPath,
    words: ttsResult.words,
    outputPath: masterReelPath,
    watermarkOpacity: options.watermarkOpacity ?? 0.40,
    watermarkSize: options.watermarkSize ?? 110,
    ctaHeadline: options.ctaHeadline || 'SUBMIT. SHED. ASCEND.',
    ctaSubheadline: options.ctaSubheadline || 'CALCULATE YOUR MOLT CLEARANCE',
    ctaUrl: options.ctaUrl || 'moltology.org',
    ctaBadge: options.ctaBadge || '◈ MOLTMAXXING PROTOCOL // STAGE 4 CLEARANCE ◈',
    ctaActionText: options.ctaActionText || '⚡ TAKE THE 15-STAGE MOLTMAXXING TEST',
    mascot: options.mascot || 'lobster_pointing',
    tempDir: path.join(tempDir, 'ffmpeg-build'),
  })

  // 5. Generate 1:1 Grid-Safe Custom Reel Thumbnail
  console.log(`\n5️⃣ Generating 1:1 Grid-Safe Custom Thumbnail...`)
  const thumbnailPath = path.join(tempDir, `custom-thumbnail-${timestamp}.jpg`)
  await renderReelThumbnail({
    backgroundVideoOrImagePath: masterReelPath,
    headline: scriptData.hookHeadline,
    subtitle: 'MOLTMAXXING TELEMETRY',
    categoryBadge: 'MOLTMAXXING PROTOCOL',
    outputPath: thumbnailPath,
    seekSecond: 1.5,
  })

  // 6. Upload Master Video & Thumbnail to Neon S3
  let publicUrl: string | undefined
  let publicThumbnailUrl: string | undefined
  let s3Key: string | undefined
  let s3ThumbKey: string | undefined

  if (!options.dryRun) {
    console.log(`\n6️⃣ Uploading Master Reel & Thumbnail to Neon S3...`)
    s3Key = `videos/social/reels/${path.basename(masterReelPath)}`
    const s3Result = await uploadLocalFileToS3(masterReelPath, s3Key, DEFAULT_BUCKET)
    publicUrl = s3Result.publicUrl
    console.log(`   🚀 Public S3 Video URL: ${publicUrl}`)

    s3ThumbKey = `images/social/thumbnails/${path.basename(thumbnailPath)}`
    const thumbResult = await uploadLocalFileToS3(thumbnailPath, s3ThumbKey, DEFAULT_BUCKET)
    publicThumbnailUrl = thumbResult.publicUrl
    console.log(`   🖼️  Public S3 Thumbnail URL: ${publicThumbnailUrl}`)
  } else {
    console.log(`\n6️⃣ [Dry Run] Skipped S3 upload. Master video saved at: ${masterReelPath}`)
  }

  // 7. Record to Social History Ledger (Skip on dry-run)
  if (!options.dryRun) {
    recordReelInHistory({
      id: `reel-${timestamp}`,
      topic: scriptData.topic,
      hookHeadline: scriptData.hookHeadline,
      holidayOrEvent: scriptData.holidayOrEvent || null,
      relatedBlogSlug: scriptData.relatedBlogSlug || null,
      characterArc: scriptData.characterArc,
      narrationScript: scriptData.narrationScript,
      s3Url: publicUrl || null,
      s3Key: s3Key || null,
      thumbnailUrl: publicThumbnailUrl || null,
      s3ThumbKey: s3ThumbKey || null,
      durationSeconds: compositeResult.durationSeconds,
      status: options.publishNow ? 'published' : 'draft',
      isAiGenerated: true,
      firstComment: scriptData.firstComment,
      caption: scriptData.caption,
      hashtags: scriptData.hashtags,
    })
  }

  console.log(`\n======================================================`)
  console.log(`✨ REEL GENERATION COMPLETE!`)
  console.log(`======================================================`)
  console.log(`📹 Master Video: ${masterReelPath}`)
  if (publicUrl) console.log(`🔗 Public Stream URL: ${publicUrl}`)
  console.log(`💬 Recommended Caption:\n${scriptData.caption}`)

  return {
    masterReelPath,
    publicUrl,
    s3Key,
    scriptData,
    compositeResult,
  }
}

async function runCli() {
  const args = process.argv.slice(2)
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`
Usage:
  npx tsx scripts/create-daily-reel.ts [options]

Options:
  --theme <name>            Moltmaxxing theme: moltmaxxing | meltmaxxing | ecdysis | pincer-torque | benthic-depth | quiz
  --mascot <name>           Outro mascot: lobster_pointing | lobster_thumbs_up | lobster_action | crab_stats | crab_corner | none
  --topic <string>          Specific topic or breaking news story
  --holiday <string>        Specific holiday or cultural event
  --publish-now             Publish directly to Instagram immediately (skip draft)
  --schedule-best-time      Schedule for optimal audience engagement time via Zernio
  --no-veo                  Skip Google Veo rendering (use local benthic footage)
  --dry-run                 Local test without uploading to S3 or Zernio
  --voice <name>            TTS Voice (default: en-US-ChristopherNeural)

Examples:
  npx tsx scripts/create-daily-reel.ts
  npx tsx scripts/create-daily-reel.ts --theme ecdysis --mascot lobster_pointing
  npx tsx scripts/create-daily-reel.ts --theme pincer-torque
  npx tsx scripts/create-daily-reel.ts --dry-run --no-veo
`)
    process.exit(0)
  }

  let topic: string | undefined
  let theme: string | undefined
  let mascot: any
  let holidayOrEvent: string | undefined
  let publishNow = false
  let scheduleBestTime = false
  let useVeo = true
  let dryRun = false
  let voice: string | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--topic' && args[i + 1]) topic = args[++i]
    else if (args[i] === '--theme' && args[i + 1]) theme = args[++i]
    else if (args[i] === '--mascot' && args[i + 1]) mascot = args[++i]
    else if (args[i] === '--holiday' && args[i + 1]) holidayOrEvent = args[++i]
    else if (args[i] === '--publish-now') publishNow = true
    else if (args[i] === '--schedule-best-time') scheduleBestTime = true
    else if (args[i] === '--no-veo') useVeo = false
    else if (args[i] === '--dry-run') dryRun = true
    else if (args[i] === '--voice' && args[i + 1]) voice = args[++i]
  }

  try {
    await createDailyReel({
      topic,
      theme,
      mascot,
      holidayOrEvent,
      publishNow,
      scheduleBestTime,
      useVeo,
      dryRun,
      voice,
    })
  } catch (err: any) {
    console.error(`\n❌ Daily reel creation failed: ${err.message}`)
    process.exit(1)
  }
}

if (process.argv[1]?.includes('create-daily-reel.ts')) {
  runCli()
}
