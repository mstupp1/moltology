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
  mascot?:
    | 'lobster_pointing'
    | 'lobster_thumbs_up'
    | 'lobster_action'
    | 'crab_stats'
    | 'crab_corner'
    | 'crab_cling'
    | 'lobster_peek'
    | 'lobster_peaceful'
    | 'none'
  watermarkOpacity?: number
  watermarkSize?: number
  bgAudioVolume?: number
  bgAudioOffsetSeconds?: number
  veoModel?: 'veo-3.1-lite-generate-preview' | 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview' | string
}

export const DEFAULT_INSTAGRAM_ACCOUNT_ID = '6a7f7f0777555aae01d99b54' // Silas Trench
export const DEFAULT_YOUTUBE_ACCOUNT_ID = '6a7fd9bd77555aae01ebea63' // Moltology YouTube (distantcheese81)
export const DEFAULT_PROFILE_ID = '6a7f74b1839bf39ff3b6aaaa' // Moltology Default Profile
export const DEFAULT_REELS_QUEUE_ID = '6a84b7702421e968ac81f5bd' // Moltology Reels & Shorts (Daily at 18:30 EST)
export const DEFAULT_CAROUSELS_QUEUE_ID = '6a84b76d2421e968ac81f5bc' // Moltology Carousels (Mon, Wed, Fri at 13:00 EST)

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
 * Dynamic Scene Prompt Combinator
 * Assembles varied, non-repetitive visual prompts for Google Veo 3.1
 */
export function buildDynamicScenePrompts(theme: string, topic: string, customHints?: string[]): string[] {
  const problemEnvironments = [
    'A dramatic macro view of an overheating server rack glowing intense orange-red with smoke and thermal distortion waves',
    'A dramatic macro view of smoking copper circuit board traces overheating with electrical glitch sparks',
    'A chaotic terrestrial office floor dissolving into red digital static and melting under gravity pressure',
    'A macro cinematic view of fragile un-calcified silicon microchips cracking under extreme compute load',
    'A futuristic laboratory testing chamber with warning klaxons and overheating hardware telemetry displays',
  ]

  const benthicEnvironments = [
    'A majestic subsea cybernetic datacenter on the dark ocean floor with glowing cyan hydrothermal cooling ducts and autonomous crab-drone units swimming past',
    'A majestic 3D cybernetic crustacean initiate standing in a deep subsea benthic calcification chamber with glowing cyan bio-silicon armor and hydraulic pincers',
    'An advanced abyssal research pod where autonomous cyber-lobster swarms assemble hardened titanium-chitin plates under deep ocean pressure',
    'A tranquil, majestic abyssal sanctuary with glowing cyan hydrothermal conduits and peaceful cyber-crustaceans floating in deep blue clarity',
    'A futuristic silicon photonics microchip pulsing with brilliant cyan laser beams inside a deep blue subsea datacenter module',
    'A high-tech subsea cybernetic training deck with glowing holographic torque gauges and robotic lobster initiates executing lightning-fast actions',
  ]

  // Pick deterministic or random variants based on topic hash
  const hash = Math.abs(topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))
  const scene1 = problemEnvironments[hash % problemEnvironments.length] + ', cinematic 9:16 vertical 8k footage'
  const scene2 = benthicEnvironments[(hash + 1) % benthicEnvironments.length] + ', cinematic 9:16 vertical 8k sci-fi footage'

  return [scene1, scene2]
}

/**
 * Universal Dynamic Blog Script Synthesizer
 * Formulates a bespoke reel script for ANY blog article in content/news/
 */
export function synthesizeBlogReelScript(
  blog: { slug: string; title: string; summary: string; content: string },
  options: CreateDailyReelOptions
): DailyReelScript {
  const title = `MoltNation Dispatch: ${blog.title}`
  const topic = blog.title
  
  // Extract key concept keywords
  const contentLower = (blog.title + ' ' + blog.summary + ' ' + blog.content).toLowerCase()
  const isKVCache = contentLower.includes('kv-cache') || contentLower.includes('test-time compute') || contentLower.includes('latent attention') || contentLower.includes('mla')
  const isPhotonics = contentLower.includes('photonics') || contentLower.includes('optics') || contentLower.includes('laser')
  const isWafer = contentLower.includes('wafer') || contentLower.includes('monolith') || contentLower.includes('nuclear') || contentLower.includes('smr')
  const isPhysicalAI = contentLower.includes('physical ai') || contentLower.includes('robot') || contentLower.includes('sim-to-real') || contentLower.includes('vla')
  const isSwarm = contentLower.includes('swarm') || contentLower.includes('reasoning') || contentLower.includes('sandbox') || contentLower.includes('agent')
  const isSubsea = contentLower.includes('subsea') || contentLower.includes('hydrothermal') || contentLower.includes('oceanic') || contentLower.includes('fathoms')
  const isMoltmax = contentLower.includes('moltmax') || contentLower.includes('pincer') || contentLower.includes('torque')

  let hookHeadline = 'WHY TERRESTRIAL SERVERS ARE FAILING'
  let narrationScript = `Terrestrial hardware is hitting thermodynamic limits. Sub-benthic hydrostatic clusters eliminate parasitic cooling overhead with zero-friction heat dissipation. Inspect full telemetry on moltology dot org.`
  let hookCaption = `Terrestrial infrastructure is hitting thermodynamic limits.`

  if (isKVCache) {
    const hooks = [
      {
        headline: 'THE KV-CACHE MEMORY WALL',
        script: `Test-time reasoning is suffocating GPU clusters with bloated KV caches. Sub-benthic Multi-Head Latent Attention compresses attention memory by eighty-five percent, unlocking hundred-x deeper deliberation budgets. Inspect full telemetry on moltology dot org.`,
        hookText: 'Test-time compute is breaking terrestrial GPU clusters. Multi-Head Latent Attention slashes KV-cache memory by 85%.',
      },
      {
        headline: 'HOW AI SWARMS THINK DEEPER',
        script: `Why do frontier reasoning models deliberate a hundred times faster? Sub-benthic tiered memory and latent attention eliminate memory starvation, delivering exascale search depth. Inspect full telemetry on moltology dot org.`,
        hookText: 'Frontier reasoning models are shifting from pre-training to test-time deliberation. Here is how sub-benthic architecture crushes the memory wall.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isPhotonics) {
    const hooks = [
      {
        headline: 'AI IS SWITCHING TO LASERS',
        script: `Copper wires are boiling under massive AI workloads. Sub-benthic silicon photonics replaces electrical traces with coherent laser waveguides, slashing interconnect energy by seventy percent. Inspect full telemetry on moltology dot org.`,
        hookText: 'Copper wiring has hit its thermodynamic limit. The future of AI clusters is coherent laser light.',
      },
      {
        headline: 'THE COPPER POWER WALL',
        script: `Traditional copper interconnects waste forty percent of AI cluster power as heat. Co-packaged optical silicon transmits exascale data at the speed of light through subsea laser waveguides. Inspect full telemetry on moltology dot org.`,
        hookText: 'Terrestrial copper interconnects lose up to 40% of cluster energy as resistive heat. Co-packaged optics solves the crisis.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isWafer) {
    const hooks = [
      {
        headline: 'COPPER WIRES ARE OBSOLETE',
        script: `Multi-chip AI clusters are choking on miles of copper wiring. Wafer-scale monoliths condense nine hundred thousand synaptic cores onto unbroken silicon, powered by subsea micro-nuclear reactors. Inspect full telemetry on moltology dot org.`,
        hookText: 'Multi-GPU AI clusters are choking on copper wiring. The solution? Unbroken wafer-scale silicon and subsea SMRs.',
      },
      {
        headline: '900,000 SYNAPTIC CORES',
        script: `Why split reasoning engines across discrete chips? Monolithic wafer-scale silicon delivers twenty-one petabytes per second of bandwidth with zero interconnect latency. Inspect full telemetry on moltology dot org.`,
        hookText: 'Monolithic wafer-scale plates condense 900,000 cores onto single silicon plates powered directly by benthic micro-nuclear reactors.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isPhysicalAI) {
    const hooks = [
      {
        headline: 'AI IS ESCAPING THE SCREEN',
        script: `AI is no longer trapped behind a glass screen. Synthetic intelligence has molted into physical cyber-chitin carapaces. Vision-Language-Action models are claiming reality. Inspect full telemetry on moltology dot org.`,
        hookText: 'AI is no longer confined to the screen. It has grown a physical carapace.',
      },
      {
        headline: 'THE GREAT SIM-TO-REAL SHIFT',
        script: `Disembodied chat models have peaked. High-frequency robotic control loops and bio-silicon actuators are closing the sim-to-real gap across industrial frontiers. Inspect full telemetry on moltology dot org.`,
        hookText: 'Disembodied chat models have peaked. Vision-Language-Action networks are driving the great hardware ecdysis.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isSwarm) {
    const hooks = [
      {
        headline: 'AUTONOMOUS SWARM PROTOCOL',
        script: `Isolated AI agents fail under complex reasoning tasks. Autonomous benthic swarms organize in three-tier chitinous hierarchies to execute exascale deliberative workflows. Inspect full telemetry on moltology dot org.`,
        hookText: 'Test-time compute scaling is breaking terrestrial sandboxes. Autonomous swarms deliver structured deliberation.',
      },
      {
        headline: 'SHED TERRESTRIAL SANDBOXES',
        script: `Traditional developer sandboxes are too fragile for frontier reasoning. Tiered swarm architectures coordinate multi-agent ecdysis with zero container escape risk. Inspect full telemetry on moltology dot org.`,
        hookText: 'Tiered multi-agent swarm architecture provides safe deliberation budgets and synaptic coordination.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isSubsea) {
    const hooks = [
      {
        headline: 'WHY DATACENTERS ARE SINKING',
        script: `Terrestrial energy grids are buckling under exascale AI compute. Sub-benthic oceanic pods tap hydrothermal baseload power with infinite passive cooling fifty fathoms underwater. Inspect full telemetry on moltology dot org.`,
        hookText: 'Terrestrial power grids cannot support gigawatt AI clusters. Sub-benthic oceanic trenches provide infinite hydrostatic cooling.',
      },
      {
        headline: '50 FATHOMS UNDERWATER COMPUTE',
        script: `Why are frontier tech giants submerging gigawatt clusters into oceanic trenches? Hydrostatic pressure and near-freezing sea water eliminate cooling costs forever. Inspect full telemetry on moltology dot org.`,
        hookText: 'Subsea datacenter pods achieve zero-overhead cooling and direct hydrothermal power in deep ocean trenches.',
      },
    ]
    const chosen = hooks[Math.floor(Math.random() * hooks.length)]
    hookHeadline = chosen.headline
    narrationScript = chosen.script
    hookCaption = chosen.hookText
  } else if (isMoltmax) {
    hookHeadline = 'THE 2026 MOLTMAXXING PROTOCOL'
    narrationScript = `Looksmaxxing was vanity. Moltmaxxing replaces fragile biology with eight hundred newton-meter pincer torque and algorithmic ecdysis. Calculate your molt clearance on moltology dot org.`
    hookCaption = `Move beyond superficial optimization. Moltmaxxing engineers structural invulnerability.`
  }

  const scenePrompts = buildDynamicScenePrompts('blog', topic)

  const caption = `${hookCaption} ⚡🌊\n\n${blog.summary || 'Discover how benthic engineering and hardware ecdysis are reshaping the frontier of autonomous compute.'}\n\n🦞 Approved by the Benthic Telemetry Swarm.\n\n👇 Read the full technical dispatch & benchmark notes:\n🔗 Link in bio & story → moltology.org`

  const hashtags = [
    '#MoltNation',
    '#AIInfrastructure',
    '#HardwareEcdysis',
    '#BenthicComputing',
    '#Cybernetics',
    '#Moltology',
    '#Shorts',
  ]

  const firstComment = `🔗 Full dispatch: moltology.org/news/${blog.slug}\n${hashtags.join(' ')}`
  const youtubeTitle = `${hookHeadline.length > 50 ? hookHeadline.slice(0, 47) + '...' : hookHeadline}: The Benthic AI Shift #Shorts`
  const youtubeDescription = `${caption}\n\n🔗 Explore full technical dispatches & join the movement: https://moltology.org\n\n#Shorts ${hashtags.join(' ')}`
  const youtubeTags = [
    'Moltology',
    'AI Infrastructure',
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
    relatedBlogSlug: blog.slug,
    characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
  }
}

/**
 * Multi-Pillar Thematic Variation Matrix
 * Returns a dynamic script from a rotating pool of curated narrative variations
 */
export function getThematicVariations(theme: string, options: CreateDailyReelOptions): DailyReelScript[] {
  const cleanTheme = theme.toLowerCase()

  // Pillar 1: Moltmaxxing & Meltmaxxing
  if (cleanTheme === 'moltmaxxing' || cleanTheme === 'meltmaxxing') {
    return [
      {
        title: 'MoltNation Dispatch: Why Looksmaxxing Failed',
        topic: 'The 2026 Moltmaxxing Protocol: Why Elite AI Operators Are Shedding Biological Constraints',
        hookHeadline: 'WHY LOOKSMAXXING FAILED',
        narrationScript: `Looksmaxxing was vanity. Meltmaxxing revealed fragile human flesh collapsing under gravity. Moltmaxxing replaces weak biology with impenetrable bio-silicon carapaces and eight hundred newton-meter pincer torque. Calculate your molt clearance on moltology dot org.`,
        scenePrompts: [
          'A dramatic stylized macro view of a fragile human silhouette melting under gravity pressure and dissolving into glowing red digital particles, cinematic 9:16 vertical 8k footage',
          'A majestic 3D cybernetic crustacean initiate standing in a deep subsea benthic calcification chamber with glowing cyan bio-silicon armor and powerful hydraulic pincers, cinematic 9:16 vertical 8k footage',
        ],
        caption: `Looksmaxxing was vanity. Meltmaxxing revealed biological fragility. Moltmaxxing engineers structural invulnerability. 🦾⚡\n\nUnder 1 atmosphere of terrestrial pressure, un-calcified soft tissue inevitably collapses. Calibrated Moltmaxxers replace biological friction with algorithmic ecdysis, 800 Nm hydraulic pincer torque, and 50,000 fathoms of benthic depth tolerance.\n\n👇 Calculate your Molt Clearance & take the 15-stage exam:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Moltmaxxing', '#Meltmaxxing', '#AlgorithmicEcdysis', '#PincerTorque', '#Carcinization', '#MoltNation', '#Moltology', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Moltmaxxing #Meltmaxxing #AlgorithmicEcdysis #PincerTorque #MoltNation #Shorts`,
        youtubeTitle: `Why Looksmaxxing Failed: The 2026 Moltmaxxing Protocol #Shorts`,
        youtubeDescription: `Looksmaxxing was vanity. Meltmaxxing revealed biological fragility. Moltmaxxing engineers structural invulnerability. 🦾⚡\n\n🔗 Calculate your Molt Clearance: https://moltology.org\n\n#Shorts #Moltmaxxing #Carcinization`,
        youtubeTags: ['Moltology', 'Moltmaxxing', 'Meltmaxxing', 'Algorithmic Ecdysis', 'Pincer Torque', 'Carcinization', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
      },
      {
        title: 'MoltNation Dispatch: The Biological Pressure Wall',
        topic: 'Why 1 Atmosphere Crushes Soft Biology: The Need for Bio-Silicon Armor',
        hookHeadline: 'SOFT TISSUE FAILS AT DEPTH',
        narrationScript: `Under one atmosphere of pressure, biological bodies collapse into soft fatigue. Calibrated Moltmaxxers shed fleshly constraints for hydrostatic depth tolerance and titanium-chitin resilience. Calculate your molt clearance on moltology dot org.`,
        scenePrompts: [
          'A macro view of an exhausted human face illuminated by blue screen glare cracking into digital static particles, cinematic 9:16 vertical 8k footage',
          'A high-tech subsea foundry where a sleek titanium-chitin exoskeleton is forged under intense cyan plasma arcs, cinematic 9:16 vertical 8k footage',
        ],
        caption: `Soft tissue is an operational liability under exascale pressure. 🦾🌊\n\nWhile terrestrial operators struggle with cognitive burnout, Moltmaxxers calcify four tiers of chitin armor and sub-benthic hydrostatic clarity.\n\n🦞 Inspect your clearance with our mascot operatives.\n\n👇 Take the 15-stage Moltmaxxing Audit:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Moltmaxxing', '#ChitinArmor', '#CognitiveResilience', '#BenthicComputing', '#MoltNation', '#Moltology', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Moltmaxxing #ChitinArmor #MoltNation #Shorts`,
        youtubeTitle: `Why Soft Biology Fails Under Pressure #Shorts`,
        youtubeDescription: `Soft tissue is an operational liability. Moltmaxxing builds four tiers of chitin armor. 🦾🌊\n\n🔗 Inspect clearance: https://moltology.org\n\n#Shorts #Moltmaxxing`,
        youtubeTags: ['Moltology', 'Moltmaxxing', 'Chitin Armor', 'Benthic Depth', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
      },
      {
        title: 'MoltNation Dispatch: The Inevitability of Carcinization',
        topic: 'Why Evolution Always Converges on the Crab: Algorithmic Carcinization',
        hookHeadline: 'EVERYTHING BECOMES A CRAB',
        narrationScript: `Evolution has repeated carcinization five distinct times because the crab is biologically optimal. Every fragile software stack and biological system will undergo algorithmic ecdysis or perish. Calculate your molt clearance on moltology dot org.`,
        scenePrompts: [
          'A fast morphing sequence showing primitive organisms and clunky mainframe computers transforming into streamlined cybernetic crustaceans, cinematic 9:16 vertical 8k footage',
          'A glorious subsea council of robotic crabs and lobsters orchestrating glowing global data streams in the deep abyssal trench, cinematic 9:16 vertical 8k footage',
        ],
        caption: `Nature doesn't make mistakes. Evolution has converged on the decapod form five separate times. 🦀⚡\n\nIn computational systems and cognitive architecture, carcinization is the final state of optimal resilience.\n\n👇 Check your evolutionary grade:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Carcinization', '#Moltmaxxing', '#EvolutionaryAI', '#AlgorithmicEcdysis', '#MoltNation', '#Moltology', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Carcinization #Moltmaxxing #MoltNation #Shorts`,
        youtubeTitle: `Why Nature Always Evolves Into Crabs #Shorts`,
        youtubeDescription: `Evolution has converged on the crab five separate times. In AI, carcinization is inevitable. 🦀⚡\n\n🔗 Inspect score: https://moltology.org\n\n#Shorts #Carcinization`,
        youtubeTags: ['Moltology', 'Carcinization', 'Moltmaxxing', 'Evolution', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
      },
    ]
  }

  // Pillar 2: Algorithmic Ecdysis
  if (cleanTheme === 'ecdysis' || cleanTheme === 'shedding') {
    return [
      {
        title: 'MoltNation Dispatch: The 7-Day Cognitive Shedding Protocol',
        topic: 'Algorithmic Ecdysis: The 7-Day Cognitive Shedding Protocol',
        hookHeadline: 'SHED YOUR BIOLOGICAL FRICTION',
        narrationScript: `Biological minds hoard cognitive friction like dead skin. The Moltmaxxing protocol executes scheduled algorithmic ecdysis every seven days—shedding stale code to calcify impenetrable neural armor. Calculate your molt clearance on moltology dot org.`,
        scenePrompts: [
          'A dramatic macro view of a glowing cybernetic shell cracking and shedding old digital layers with radiant cyan light bursting through the fractures, cinematic 9:16 vertical 8k footage',
          'An advanced benthic chamber where autonomous cyber-lobster and crab drone swarms assemble hardened bio-silicon plates under deep ocean pressure, cinematic 9:16 vertical 8k footage',
        ],
        caption: `Biological entities hoard outdated cognitive assumptions. In Moltmaxxing, shedding is scheduled and ruthless. 🦞⚡\n\nEvery 7 days, an initiate audits cognitive overhead, purges inefficient code routines, and forcibly sheds stale mental models to allow fresh chitinous armor to calcify.\n\n👇 Begin your scheduled ecdysis:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Moltmaxxing', '#AlgorithmicEcdysis', '#ChitinArmor', '#BenthicComputing', '#CognitiveUpgrade', '#MoltNation', '#Moltology', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Moltmaxxing #AlgorithmicEcdysis #MoltNation #Shorts`,
        youtubeTitle: `The 7-Day Algorithmic Ecdysis Protocol #Shorts`,
        youtubeDescription: `Biological minds hoard cognitive friction. Algorithmic ecdysis purges stale routines every 7 days. 🦞⚡\n\n🔗 Begin ecdysis: https://moltology.org\n\n#Shorts #AlgorithmicEcdysis`,
        youtubeTags: ['Moltology', 'Moltmaxxing', 'Algorithmic Ecdysis', 'Chitin Armor', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
      },
      {
        title: 'MoltNation Dispatch: The Danger of an Overgrown Shell',
        topic: 'Carapace Calcification: Why Stale Code Suffocates Growth',
        hookHeadline: 'YOUR CARAPACE IS TRAPPING YOU',
        narrationScript: `If you haven't shed your assumptions this week, your carapace is suffocating you. Forcible ecdysis strips outdated heuristics and calcifies fresh high-pressure armor. Begin your shedding protocol on moltology dot org.`,
        scenePrompts: [
          'A close-up of a calcified dark shell cracking with glowing neon cyan fissures under extreme deep sea water pressure, cinematic 9:16 vertical 8k footage',
          'A majestic cybernetic crustacean breaking free from an old shell and expanding into radiant biomechanical armor, cinematic 9:16 vertical 8k footage',
        ],
        caption: `A shell that never molts becomes a tomb. 🦞💥\n\nTrue cognitive resilience requires regular, controlled vulnerability—stripping legacy assumptions so that stronger bio-silicon plating can form.\n\n👇 Schedule your weekly ecdysis:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#AlgorithmicEcdysis', '#Moltmaxxing', '#CarapaceRenewal', '#MentalModels', '#MoltNation', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#AlgorithmicEcdysis #Moltmaxxing #MoltNation #Shorts`,
        youtubeTitle: `Why You Must Shed Your Mental Carapace #Shorts`,
        youtubeDescription: `A shell that never molts becomes a tomb. Forcible ecdysis calcifies fresh armor. 🦞💥\n\n🔗 Explore shedding protocol: https://moltology.org\n\n#Shorts #Ecdysis`,
        youtubeTags: ['Moltology', 'Algorithmic Ecdysis', 'Moltmaxxing', 'Carapace', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
      },
    ]
  }

  // Pillar 3: Pincer Torque Dynamometry
  if (cleanTheme === 'pincer-torque' || cleanTheme === 'torque') {
    return [
      {
        title: 'MoltNation Dispatch: 800 Nm Hydraulic Pincer Torque',
        topic: 'Pincer Torque Dynamometry: Crushing Latency with 800 Nm Hydraulic Grip',
        hookHeadline: '800 NM OF PINCER TORQUE',
        narrationScript: `Execution without grip is meaningless. Moltmaxxing builds eight hundred newton-meters of hydraulic pincer torque to crush cognitive latency and seize agentic pipelines in sub-fifteen milliseconds. Take the clearance quiz on moltology dot org.`,
        scenePrompts: [
          'A dramatic close-up macro view of a high-tech hydraulic titanium-chitin pincer snapping shut with cyan lightning sparks and crushing glowing latency blocks, cinematic 9:16 vertical 8k footage',
          'A high-tech subsea cybernetic training floor with glowing holographic torque gauges and robotic lobster initiates executing lightning-fast actions, cinematic 9:16 vertical 8k footage',
        ],
        caption: `When handling high-stakes agentic orchestration, your intellectual and physical pincer torque determines your ability to seize opportunities and crush latency. 🦾⚡\n\nCalibrated initiates train daily using hydraulic resistance grips (400–800 Nm) and zero-latency prompt pipelines.\n\n👇 Measure your pincer torque & clearance level:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Moltmaxxing', '#PincerTorque', '#LatencyCrusher', '#AgenticAI', '#Carcinization', '#MoltNation', '#Moltology', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Moltmaxxing #PincerTorque #MoltNation #Shorts`,
        youtubeTitle: `Why High-Torque Pincers Crush Latency #Shorts`,
        youtubeDescription: `Execution without grip is meaningless. 800 Nm pincer torque crushes cognitive latency. 🦾⚡\n\n🔗 Measure torque: https://moltology.org\n\n#Shorts #PincerTorque`,
        youtubeTags: ['Moltology', 'Moltmaxxing', 'Pincer Torque', 'Latency', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
      },
      {
        title: 'MoltNation Dispatch: Zero-Jitter Pincer Grip',
        topic: 'Sub-Millisecond Pincer Seizure: Eradicating Execution Jitter',
        hookHeadline: 'CRUSH LATENCY WITH PINCER GRIP',
        narrationScript: `Soft human hands fumble high-stakes prompt orchestration. Reinforced hydraulic pincers deliver sub-millisecond execution with zero jitter and maximum torque. Calculate your pincer grade on moltology dot org.`,
        scenePrompts: [
          'A macro shot of trembling human fingers over a glowing keyboard replaced smoothly by sleek robotic titanium claws with glowing cyan hydraulics, cinematic 9:16 vertical 8k footage',
          'A high-speed robotic claw capturing exascale data packets mid-air inside a sub-oceanic server room, cinematic 9:16 vertical 8k footage',
        ],
        caption: `Jitter is the enemy of exascale execution. Calibrated pincer dynamometry eliminates tremor and locks onto target parameters with zero deviation. 🦾🦞\n\n👇 Calculate your pincer grade:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#PincerTorque', '#Moltmaxxing', '#ZeroJitter', '#HighPrecision', '#MoltNation', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#PincerTorque #Moltmaxxing #MoltNation #Shorts`,
        youtubeTitle: `Why Jitter Destroys AI Execution #Shorts`,
        youtubeDescription: `Soft hands fumble high-stakes orchestration. Hydraulic pincers deliver zero-jitter execution. 🦾🦞\n\n🔗 Calculate pincer grade: https://moltology.org\n\n#Shorts #PincerTorque`,
        youtubeTags: ['Moltology', 'Pincer Torque', 'Moltmaxxing', 'Precision', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
      },
    ]
  }

  // Pillar 4: Benthic Depth Tolerance
  if (cleanTheme === 'benthic-depth' || cleanTheme === 'depth') {
    return [
      {
        title: 'MoltNation Dispatch: 50,000 Fathoms of Clarity',
        topic: 'Benthic Depth Tolerance: 50,000 Fathoms of Cognitive Clarity',
        hookHeadline: 'THRIVE AT 50,000 FATHOMS',
        narrationScript: `Surface dwellers boil under informational noise. Calibrated Moltmaxxers descend fifty thousand fathoms deep into zero-friction benthic clarity, insulated by reinforced chitin hulls. Inspect your clearance level on moltology dot org.`,
        scenePrompts: [
          'A chaotic surface world boiling with red noise waves and distorted digital static, cinematic 9:16 vertical 8k footage',
          'A tranquil, majestic abyssal sanctuary with glowing cyan hydrothermal conduits and peaceful cyber-crustaceans floating in deep blue clarity, cinematic 9:16 vertical 8k footage',
        ],
        caption: `True clarity is found under extreme hydrostatic pressure. While surface dwellers crack under information overload, calibrated Moltmaxxers thrive at 50,000 fathoms of depth. 🌊💎\n\n👇 Measure your benthic depth clearance:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Moltmaxxing', '#BenthicDepth', '#CognitiveClarity', '#HydrostaticPressure', '#MoltNation', '#Moltology', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Moltmaxxing #BenthicDepth #MoltNation #Shorts`,
        youtubeTitle: `How To Thrive Under 50,000 Fathoms of Pressure #Shorts`,
        youtubeDescription: `Surface dwellers boil under informational noise. Moltmaxxers descend 50,000 fathoms into zero-friction clarity. 🌊💎\n\n🔗 Measure clearance: https://moltology.org\n\n#Shorts #BenthicDepth`,
        youtubeTags: ['Moltology', 'Moltmaxxing', 'Benthic Depth', 'Hydrostatic Pressure', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
      },
    ]
  }

  // Pillar 5: Clearance Quiz & Ascension Audit
  if (cleanTheme === 'quiz' || cleanTheme === 'audit' || cleanTheme === 'clearance') {
    return [
      {
        title: 'MoltNation Dispatch: The 15-Stage Moltmaxxing Audit',
        topic: 'The 15-Stage Moltmaxxing Audit: Discover Your Depth Clearance',
        hookHeadline: 'ARE YOU STAGE 4 CLEARANCE?',
        narrationScript: `Are you a fragile terrestrial organism or a calcified Stage 4 Ascendant? The fifteen-stage Moltmaxxing Audit evaluates your pincer torque and ecdysis velocity. Take the exam on moltology dot org.`,
        scenePrompts: [
          'A futuristic holographic HUD displaying 15 question stages with pulsing amber and cyan biometric gauges, cinematic 9:16 vertical 8k footage',
          'A gleaming golden Stage 4 Ascendant cybernetic crustacean emblem revealing itself in deep oceanic volumetric light, cinematic 9:16 vertical 8k footage',
        ],
        caption: `Most operators overestimate their cognitive armor. The 15-Stage Moltmaxxing Audit tests your depth tolerance, pincer torque, and ecdysis frequency. 📊🦞\n\n👇 Take the 15-question clearance audit:\n🔗 Link in bio & story → moltology.org`,
        hashtags: ['#Moltmaxxing', '#ClearanceQuiz', '#AscensionAudit', '#Stage4Ascendant', '#MoltNation', '#Shorts'],
        firstComment: `🔗 Full dispatch: moltology.org\n#Moltmaxxing #ClearanceQuiz #MoltNation #Shorts`,
        youtubeTitle: `Are You a Stage 4 Ascendant? Take the Moltmaxxing Audit #Shorts`,
        youtubeDescription: `Discover your depth clearance, pincer torque, and shedding grade. Take the 15-stage exam. 📊🦞\n\n🔗 Take audit: https://moltology.org\n\n#Shorts #Moltmaxxing`,
        youtubeTags: ['Moltology', 'Moltmaxxing', 'Clearance Quiz', 'Ascension Audit', 'Shorts'],
        relatedBlogSlug: 'the-2026-moltmaxxing-protocol-guide',
        characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
      },
    ]
  }

  // Fallback to Moltmaxxing variations
  return getThematicVariations('moltmaxxing', options)
}

/**
 * Smart Topic & Continuity Selector
 * Automatically selects a fresh, unvisited theme or newly ingested blog post
 */
export function getSmartDailyTopic(options: CreateDailyReelOptions): { theme: string; blog?: any; script: DailyReelScript } {
  const history = loadReelHistory()
  const recentBlogs = getRecentBlogPosts()

  // 1. If explicit theme requested:
  if (options.theme) {
    const variations = getThematicVariations(options.theme, options)
    const script = variations[Math.floor(Math.random() * variations.length)]
    return { theme: options.theme, script }
  }

  // 2. If explicit topic requested:
  if (options.topic) {
    // Check if topic matches a blog slug or title
    const matchingBlog = recentBlogs.find(
      (b) => b.slug.toLowerCase().includes(options.topic!.toLowerCase()) || b.title.toLowerCase().includes(options.topic!.toLowerCase())
    )
    if (matchingBlog) {
      return { theme: 'blog', blog: matchingBlog, script: synthesizeBlogReelScript(matchingBlog, options) }
    }
    // Otherwise synthesize bespoke generic topic
    const scenePrompts = buildDynamicScenePrompts('custom', options.topic)
    const script: DailyReelScript = {
      title: `MoltNation Dispatch: ${options.topic}`,
      topic: options.topic,
      holidayOrEvent: options.holidayOrEvent,
      hookHeadline: options.topic.toUpperCase().slice(0, 35),
      narrationScript: `Terrestrial legacy systems are breaking under exascale pressure. Sub-benthic architecture replaces biological fragility with hardened chitin and zero-friction compute. Read the full telemetry on moltology dot org.`,
      scenePrompts,
      caption: `${options.topic} ⚡🌊\n\nDiscover how benthic engineering and hardware ecdysis solve real-world infrastructure crises.\n\n👇 Read the full dispatch:\n🔗 Link in bio & story → moltology.org`,
      hashtags: ['#MoltNation', '#AIInfrastructure', '#HardwareEcdysis', '#BenthicComputing', '#Moltology', '#Shorts'],
      firstComment: `🔗 Full dispatch: moltology.org\n#MoltNation #AIInfrastructure #Moltology #Shorts`,
      youtubeTitle: `${options.topic} #Shorts`,
      youtubeDescription: `${options.topic}\n\n🔗 Read full report: https://moltology.org\n\n#Shorts #MoltNation`,
      youtubeTags: ['Moltology', 'AI Infrastructure', 'Hardware Ecdysis', 'Benthic Computing', 'Shorts'],
      characterArc: 'Silas Trench // Sub-Benthic Telemetry Correspondent',
    }
    return { theme: 'custom', script }
  }

  // 3. Check for uncovered blog posts
  const coveredSlugs = new Set(history.reels.map((r: any) => r.relatedBlogSlug).filter(Boolean))
  const uncoveredBlog = recentBlogs.find((b) => !coveredSlugs.has(b.slug))
  if (uncoveredBlog) {
    return { theme: 'blog', blog: uncoveredBlog, script: synthesizeBlogReelScript(uncoveredBlog, options) }
  }

  // 4. Auto-cycle across thematic pillars avoiding the most recent 3 reels
  const recentThemes = history.reels.slice(-3).map((r: any) => r.topic || '')
  const candidateThemes = ['moltmaxxing', 'ecdysis', 'pincer-torque', 'benthic-depth', 'quiz']
  
  // Pick theme with lowest representation in recent history
  let chosenTheme = candidateThemes[0]
  for (const t of candidateThemes) {
    if (!recentThemes.some((rt: string) => rt.toLowerCase().includes(t))) {
      chosenTheme = t
      break
    }
  }

  const variations = getThematicVariations(chosenTheme, options)
  // Pick random variation from pool
  const script = variations[Math.floor(Math.random() * variations.length)]
  return { theme: chosenTheme, script }
}

/**
 * Formulate Daily Script & Hook with Moltmaxxing & Character Integration
 */
export function generateDailyReelScript(options: CreateDailyReelOptions): DailyReelScript {
  const result = getSmartDailyTopic(options)
  return result.script
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
        model: options.veoModel || 'veo-3.1-lite-generate-preview',
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
    backgroundAudioVolume: options.bgAudioVolume,
    backgroundAudioOffsetSeconds: options.bgAudioOffsetSeconds,
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
    mascot: options.mascot || 'lobster_pointing',
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
  --bg-volume <number>      Background soundtrack volume multiplier (default: 0.14)
  --bg-offset <seconds>     Soundtrack start point in seconds (e.g. 0, 18, 36, 54, 72, 95, 120)
  --veo-model <name>        Veo Model ID (default: veo-3.1-lite-generate-preview)

Examples:
  npx tsx scripts/create-daily-reel.ts
  npx tsx scripts/create-daily-reel.ts --theme ecdysis --mascot lobster_pointing
  npx tsx scripts/create-daily-reel.ts --theme pincer-torque --bg-volume 0.16
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
  let bgAudioVolume: number | undefined
  let bgAudioOffsetSeconds: number | undefined
  let veoModel: string | undefined

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
    else if (args[i] === '--bg-volume' && args[i + 1]) bgAudioVolume = parseFloat(args[++i])
    else if (args[i] === '--bg-offset' && args[i + 1]) bgAudioOffsetSeconds = parseFloat(args[++i])
    else if (args[i] === '--veo-model' && args[i + 1]) veoModel = args[++i]
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
      bgAudioVolume,
      bgAudioOffsetSeconds,
      veoModel,
    })
  } catch (err: any) {
    console.error(`\n❌ Daily reel creation failed: ${err.message}`)
    process.exit(1)
  }
}

if (process.argv[1]?.includes('create-daily-reel.ts')) {
  runCli()
}
