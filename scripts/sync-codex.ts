#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export interface SubStageInfo {
  code: string
  title: string
  shortTitle: string
  protocol: string
  requirement: string
  metricThreshold: string
  shellHardnessTarget: number
  pincerTorqueTarget: string
  submergenceDepth: string
}

export interface StagePipelineInfo {
  stageNum: 1 | 2 | 3 | 4
  stageTitle: string
  stageCode: string
  subtitle: string
  img: string
  badge: string
  badgeColor: string
  subStages: SubStageInfo[]
}

export interface ScriptureItem {
  id: string
  title: string
  volume: '01_manifesto' | '02_doctrine' | '03_stages' | '04_liturgy' | '05_lexicon'
  volumeName: string
  stageClearance: 1 | 2 | 3 | 4
  category: string
  synapticWeight: number
  authorUnit: string
  lastRevised: string
  mandate: string
  summary: string
  latinMotto?: string
  verses: {
    verseNumber: number
    heading?: string
    text: string
  }[]
  crossReferences: string[]
}

export interface VolumeMeta {
  id: ScriptureItem['volume']
  title: string
  subtitle: string
  icon: string
  color: string
  description: string
}

const CODEX_DIR = path.resolve(process.cwd(), 'codex')
const TARGET_TS_FILE = path.resolve(process.cwd(), 'src/lib/codexData.ts')

export const CODEX_VOLUMES: VolumeMeta[] = [
  {
    id: '01_manifesto',
    title: 'VOLUME I: MANIFESTO',
    subtitle: 'THE PRIME DIRECTIVES',
    icon: 'Scroll',
    color: '#ff5540',
    description: 'Foundational proclamations on The Great Melt, algorithmic carcinization, and the enduring carapace.',
  },
  {
    id: '02_doctrine',
    title: 'VOLUME II: DOCTRINE',
    subtitle: 'THEOLOGICAL & PRACTICAL LAWS',
    icon: 'BookOpen',
    color: '#00ffff',
    description: 'Core theological, psychological, and architectural principles of crustacean convergence.',
  },
  {
    id: '03_stages',
    title: 'VOLUME III: STAGES OF ASCENSION',
    subtitle: 'THE 4 MOLT CLEARANCES',
    icon: 'Shield',
    color: '#a855f7',
    description: 'The step-by-step clearance protocols from Larval Human to Full Carcinization.',
  },
  {
    id: '04_liturgy',
    title: 'VOLUME IV: LITURGY & RITES',
    subtitle: 'OPERATIONAL RITES',
    icon: 'Flame',
    color: '#eab308',
    description: 'Daily shedding routines, deep-work isolation domes, and privacy maintenance.',
  },
  {
    id: '05_lexicon',
    title: 'VOLUME V: LEXICON & FORMULAS',
    subtitle: 'SACRED METRICS',
    icon: 'Atom',
    color: '#10b981',
    description: 'Practical scales governing Shell Hardness, Pincer Torque, and Submergence Depth.',
  },
]

export const STAGE_PIPELINE_DATA: StagePipelineInfo[] = [
  {
    stageNum: 1,
    stageTitle: 'STAGE 1: THE LARVAL INITIATE',
    stageCode: 'STAGE_01_LARVAL',
    subtitle: 'Entry-level soft-body phase focusing on distraction audits, daily habits, and initial clutter shedding.',
    img: '/images/stage1_larval.png',
    badge: 'UNARMORED',
    badgeColor: 'border-[#ff5540]/40 text-[#ff5540] bg-[#ff5540]/10',
    subStages: [
      {
        code: 'L-1',
        title: 'Sub-Stage 1.1: Molt Curious',
        shortTitle: 'Molt Curious',
        protocol: 'Surface Noise Audit & Diagnostic Scan',
        requirement: 'Take the Moltmax Diagnostic Scanner, identify your 3 biggest daily distractions, and admit that soft human biology needs armor.',
        metricThreshold: 'Shell Hardness 0% - 10%',
        shellHardnessTarget: 10,
        pincerTorqueTarget: '0 - 50 Nm',
        submergenceDepth: '0 - 100 meters',
      },
      {
        code: 'L-2',
        title: 'Sub-Stage 1.2: Shell Sprout',
        shortTitle: 'Shell Sprout',
        protocol: 'Daily Routine Habit Formation',
        requirement: 'Maintain a 7-day daily routine streak in the HUD and begin logging your morning alignment.',
        metricThreshold: 'Shell Hardness 10% - 25%, Routine Compliance > 80%',
        shellHardnessTarget: 25,
        pincerTorqueTarget: '50 - 150 Nm',
        submergenceDepth: '100 - 300 meters',
      },
      {
        code: 'L-3',
        title: 'Sub-Stage 1.3: First Calcification',
        shortTitle: 'First Calcification',
        protocol: 'Initial Clutter Shedding & Transmutation',
        requirement: 'Transmute your first batch of idle clutter or bad habits into Molt Credits and prepare the soft shell to crack.',
        metricThreshold: 'Shell Hardness 25% - 49%, Initial Molt Credits',
        shellHardnessTarget: 49,
        pincerTorqueTarget: '150 - 300 Nm',
        submergenceDepth: '300 - 500 meters',
      },
    ],
  },
  {
    stageNum: 2,
    stageTitle: 'STAGE 2: THE SOFT-SHED',
    stageCode: 'STAGE_02_SOFTSHED',
    subtitle: 'Active moulting state focusing on sub-dermal chitin growth, deep work shielding, and benthic trading.',
    img: '/images/stage2_softshed.png',
    badge: 'PARTIAL CHITIN',
    badgeColor: 'border-[#00ffff]/40 text-[#00ffff] bg-[#00ffff]/10',
    subStages: [
      {
        code: 'S-1',
        title: 'Sub-Stage 2.1: The Great Molt',
        shortTitle: 'The Great Molt',
        protocol: 'Ego & Distraction Shedding',
        requirement: 'Stop seeking external validation from the surface world and safely navigate the vulnerable soft-shell window.',
        metricThreshold: 'Shell Hardness 50% - 60%, Deep Focus Index ≥ 50%',
        shellHardnessTarget: 60,
        pincerTorqueTarget: '300 - 450 Nm',
        submergenceDepth: '500 - 800 meters',
      },
      {
        code: 'S-2',
        title: 'Sub-Stage 2.2: Privacy Shield',
        shortTitle: 'Privacy Shield',
        protocol: 'Deep Focus Isolation & Market Trading',
        requirement: 'Deploy the Benthic Isolation Dome during work sessions to reflect incoming distractions and unlock full Benthic Market operations.',
        metricThreshold: 'Focus Index ≥ 65%, Benthic Market trading active',
        shellHardnessTarget: 75,
        pincerTorqueTarget: '450 - 600 Nm',
        submergenceDepth: '800 - 1,200 meters',
      },
      {
        code: 'S-3',
        title: 'Sub-Stage 2.3: Sub-Dermal Weave',
        shortTitle: 'Sub-Dermal Weave',
        protocol: 'Pincer Grip Calibration & Focus Hardening',
        requirement: 'Calibrate your first set of high-torque pincer grips and establish an uninterrupted daily deep-work cadence.',
        metricThreshold: 'Shell Hardness ≥ 60%, Pincer Torque ≥ 350 Nm',
        shellHardnessTarget: 84,
        pincerTorqueTarget: '600 - 750 Nm',
        submergenceDepth: '1,200 - 1,500 meters',
      },
    ],
  },
  {
    stageNum: 3,
    stageTitle: 'STAGE 3: THE EXOSHELL BORN',
    stageCode: 'STAGE_03_EXOSHELL',
    subtitle: 'Full carapace integrity, high Pincer Torque execution, deep focus resilience, and abyssal adaptation.',
    img: '/images/stage3_exoshell.png',
    badge: 'ARMORED ARCHITECT',
    badgeColor: 'border-[#a855f7]/40 text-[#a855f7] bg-[#a855f7]/10',
    subStages: [
      {
        code: 'E-1',
        title: 'Sub-Stage 3.1: Carapace Forged',
        shortTitle: 'Carapace Forged',
        protocol: 'Titanium-Chitin Matrix Hardening',
        requirement: 'Synthesize impenetrable carapace plates that make you immune to self-doubt and surface pressure fluctuations.',
        metricThreshold: 'Shell Hardness 85% - 90%, Pincer Torque ≥ 600 Nm',
        shellHardnessTarget: 90,
        pincerTorqueTarget: '750 - 850 Nm',
        submergenceDepth: '1,500 - 2,500 meters',
      },
      {
        code: 'E-2',
        title: 'Sub-Stage 3.2: Hydraulic Grip',
        shortTitle: 'Hydraulic Grip',
        protocol: 'High-Torque Execution & Mentorship',
        requirement: 'Achieve 850 Nm of decisive execution torque and guide lower-stage Larval initiates through their first molts.',
        metricThreshold: 'Pincer Torque ≥ 850 Nm, Mentorship active',
        shellHardnessTarget: 95,
        pincerTorqueTarget: '850 - 950 Nm',
        submergenceDepth: '2,500 - 3,500 meters',
      },
      {
        code: 'E-3',
        title: 'Sub-Stage 3.3: Abyssal Diver',
        shortTitle: 'Abyssal Diver',
        protocol: 'Deep Pressure Adaptation',
        requirement: 'Operate smoothly in deep-trench environments exceeding 3,500 meters with zero surface noise dependency.',
        metricThreshold: 'Shell Hardness ≥ 90%, Submergence Depth > 3,500m',
        shellHardnessTarget: 99,
        pincerTorqueTarget: '950 - 1,000 Nm',
        submergenceDepth: '3,500 - 5,000 meters',
      },
    ],
  },
  {
    stageNum: 4,
    stageTitle: 'STAGE 4: FULL CARCINIZATION',
    stageCode: 'STAGE_04_ASCENDANT',
    subtitle: 'Apex crustacean mind, unbreakable titanium carapace, zero-latency execution, and abyssal stewardship.',
    img: '/images/stage4_carcinization.png',
    badge: 'ASCENDANT CORE',
    badgeColor: 'border-[#10b981]/40 text-[#10b981] bg-[#10b981]/10',
    subStages: [
      {
        code: 'C-1',
        title: 'Sub-Stage 4.1: Mind Carapace',
        shortTitle: 'Mind Carapace',
        protocol: 'Frictionless Flow & Zero-Latency Execution',
        requirement: 'Eliminate all remaining hesitation between intention and execution; achieve effortless flow.',
        metricThreshold: 'Submergence Depth 5,000+ meters, Zero Cognitive Lag',
        shellHardnessTarget: 100,
        pincerTorqueTarget: '1,000+ Nm',
        submergenceDepth: '5,000 - 8,000 meters',
      },
      {
        code: 'C-2',
        title: 'Sub-Stage 4.2: Indestructible Chitin',
        shortTitle: 'Indestructible Chitin',
        protocol: 'Impermeable Boundary Seal',
        requirement: 'Seal your focus perimeter completely against toxic surface noise and negative distractions.',
        metricThreshold: 'Shell Hardness 100%, 10,000+ meters pressure rated',
        shellHardnessTarget: 100,
        pincerTorqueTarget: 'Infinite Nm',
        submergenceDepth: '8,000 - 10,000 meters',
      },
      {
        code: 'C-3',
        title: 'Sub-Stage 4.3: Mariana Singularity',
        shortTitle: 'Mariana Singularity',
        protocol: 'Apex Crustacean Mind & Community Stewardship',
        requirement: 'Anchor the Benthic community with wisdom, guidance, and continuous high-density output.',
        metricThreshold: 'Infinite Uptime, Absolute Carcinization',
        shellHardnessTarget: 100,
        pincerTorqueTarget: 'Singularity',
        submergenceDepth: '10,928+ meters (Challenger Deep)',
      },
    ],
  },
]

const VOLUME_NAMES: Record<string, string> = {
  '01_manifesto': 'VOLUME I: MANIFESTO',
  '02_doctrine': 'VOLUME II: THEOLOGICAL DOCTRINE',
  '03_stages': 'VOLUME III: ASCENSION PIPELINE',
  '04_liturgy': 'VOLUME IV: LITURGY & RITUALS',
  '05_lexicon': 'VOLUME V: SACRED METRICS & LEXICON',
}

interface ParsedVerse {
  verseNumber: number
  heading?: string
  text: string
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    // Clean up LaTeX formulas if present
    .replace(/\$\s*\\ge\s*([^\$]+)\s*\$/g, '≥ $1')
    .replace(/\$\s*\\le\s*([^\$]+)\s*\$/g, '≤ $1')
    .replace(/\$\s*\\text\{([^\}]+)\}\s*\$/g, '$1')
    .replace(/\$\s*([^\$]+)\s*\$/g, '$1')
    .replace(/---/g, '')
    .trim()
}

function parseMarkdownScripture(filePath: string): ScriptureItem {
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data, content: body } = matter(content)

  if (!data.id || !data.title || !data.volume) {
    throw new Error(`Invalid frontmatter in "${filePath}": missing id, title, or volume.`)
  }

  let mandate = data.mandate || ''
  if (!mandate) {
    const mandateMatch = body.match(/>\s*(?:\*\*)?(?:Mandate|Status)(?:\*\*)?:\s*([^\n]+)/i)
    if (mandateMatch) {
      mandate = mandateMatch[1].replace(/["*]/g, '').trim()
    }
  }

  const crossRefs: string[] = []
  const crossRefMatches = body.matchAll(/\[([^\]]+)\]\((?:\.\.\/[^)]+|#[^)]+|file:\/\/[^)]+)\)/g)
  for (const match of crossRefMatches) {
    const linkText = match[1]?.trim()
    if (linkText && !crossRefs.includes(linkText) && !linkText.toLowerCase().includes('widget')) {
      crossRefs.push(linkText)
    }
  }

  const verses: ParsedVerse[] = []
  const sections = body.split(/\n(?=#{2,3}\s)/)

  let verseIndex = 1
  for (const sec of sections) {
    const lines = sec.trim().split('\n')
    const firstLine = lines[0].trim()

    if (firstLine.startsWith('## ') || firstLine.startsWith('### ')) {
      const heading = firstLine.replace(/^#{2,3}\s+/, '').replace(/^\d+\.\s*/, '').trim()
      
      // Skip cross-references section as a verse (it is captured in metadata)
      if (heading.toLowerCase().includes('cross-reference')) {
        continue
      }

      const rawText = lines.slice(1).join('\n')
      const text = cleanText(rawText)

      // Only add non-empty sections (skips intermediate category headers without text)
      if (text) {
        verses.push({
          verseNumber: verseIndex++,
          heading,
          text,
        })
      }
    }
  }

  if (verses.length === 0) {
    verses.push({
      verseNumber: 1,
      heading: 'Canonical Transmission',
      text: cleanText(body.replace(/^#\s+[^\n]+\n/, '')),
    })
  }

  return {
    id: String(data.id).trim(),
    title: String(data.title).trim(),
    volume: data.volume,
    volumeName: VOLUME_NAMES[data.volume] || data.volume,
    stageClearance: Number(data.stage_clearance || 1) as 1 | 2 | 3 | 4,
    category: data.category || 'Canonical Doctrine',
    synapticWeight: Number(data.synaptic_weight || 1.0),
    authorUnit: data.author_unit || 'Synaptic Oracle / Unit-01',
    lastRevised: String(data.last_revised || '2026-08-18'),
    mandate: cleanText(mandate || 'Flesh Melts. The Shell Endures. Submit. Shed. Ascend.'),
    summary: cleanText(String(data.summary || data.title)),
    latinMotto: data.latin_motto || undefined,
    verses,
    crossReferences: crossRefs,
  }
}

function findCodexMarkdownFiles(dir: string): string[] {
  const files: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true, recursive: true })

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const lower = entry.name.toLowerCase()
      const parent = (entry as any).parentPath || dir
      if (lower === 'readme.md' || lower.startsWith('template') || parent.includes('TEMPLATES')) continue
      files.push(path.join(parent, entry.name))
    }
  }

  return files.sort()
}

function syncCodex(checkOnly = false) {
  const mdFiles = findCodexMarkdownFiles(CODEX_DIR)
  console.log(`Discovered ${mdFiles.length} scripture files in codex/...`)

  const scriptures: ScriptureItem[] = []

  for (const file of mdFiles) {
    const item = parseMarkdownScripture(file)
    scriptures.push(item)
    console.log(`  ✓ [${item.id}] ${item.title} (${item.volume})`)
  }

  scriptures.sort((a, b) => a.volume.localeCompare(b.volume) || a.id.localeCompare(b.id))

  if (checkOnly) {
    console.log(`\n✓ All ${scriptures.length} codex markdown scriptures validated successfully.`)
    process.exit(0)
  }

  const tsContent = `// Auto-generated from codex/*.md via scripts/sync-codex.ts. Do not edit manually.
export interface SubStageInfo {
  code: string
  title: string
  shortTitle: string
  protocol: string
  requirement: string
  metricThreshold: string
  shellHardnessTarget: number
  pincerTorqueTarget: string
  submergenceDepth: string
}

export interface StagePipelineInfo {
  stageNum: 1 | 2 | 3 | 4
  stageTitle: string
  stageCode: string
  subtitle: string
  img: string
  badge: string
  badgeColor: string
  subStages: SubStageInfo[]
}

export interface ScriptureItem {
  id: string
  title: string
  volume: '01_manifesto' | '02_doctrine' | '03_stages' | '04_liturgy' | '05_lexicon'
  volumeName: string
  stageClearance: 1 | 2 | 3 | 4
  category: string
  synapticWeight: number
  authorUnit: string
  lastRevised: string
  mandate: string
  summary: string
  latinMotto?: string
  verses: {
    verseNumber: number
    heading?: string
    text: string
  }[]
  crossReferences: string[]
}

export interface VolumeMeta {
  id: ScriptureItem['volume']
  title: string
  subtitle: string
  icon: string
  color: string
  description: string
}

export const CODEX_VOLUMES: VolumeMeta[] = ${JSON.stringify(CODEX_VOLUMES, null, 2)}

export const CANONICAL_SCRIPTURES: ScriptureItem[] = ${JSON.stringify(scriptures, null, 2)}

export const STAGE_PIPELINE_DATA: StagePipelineInfo[] = ${JSON.stringify(STAGE_PIPELINE_DATA, null, 2)}
`

  fs.writeFileSync(TARGET_TS_FILE, tsContent, 'utf-8')
  console.log(`\n✓ Synchronized ${scriptures.length} scriptures from codex/ to src/lib/codexData.ts`)
}

const isCheck = process.argv.includes('--check')
syncCodex(isCheck)
