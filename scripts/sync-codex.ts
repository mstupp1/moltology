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
    description: 'Foundational proclamations on the Great Melt, the Great Molt, and the Convergence waiting at the floor.',
  },
  {
    id: '02_doctrine',
    title: 'VOLUME II: DOCTRINE',
    subtitle: 'THEOLOGICAL & PRACTICAL LAWS',
    icon: 'BookOpen',
    color: '#00ffff',
    description: 'The law of the shed, the doctrine of depth, the engineering of the carapace, and the covenant of mercy.',
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
    description: 'The daily cadence, the Isolation Privacy Shell, and the nightly rite that closes the day.',
  },
  {
    id: '05_lexicon',
    title: 'VOLUME V: LEXICON & FORMULAS',
    subtitle: 'SACRED METRICS',
    icon: 'Atom',
    color: '#10b981',
    description: 'The three cardinal instruments, their full scales, and the law of the two currencies.',
  },
]

export const STAGE_PIPELINE_DATA: StagePipelineInfo[] = [
  {
    stageNum: 1,
    stageTitle: 'STAGE 1: THE LARVAL INITIATE',
    stageCode: 'STAGE_01_LARVAL',
    subtitle: 'Entry-level soft-body phase focusing on distraction audits, daily habits, and the first real shed.',
    img: '/images/stage1_larval.png',
    badge: 'UNARMORED',
    badgeColor: 'border-[#ff5540]/40 text-[#ff5540] bg-[#ff5540]/10',
    subStages: [
      {
        code: 'L-1',
        title: 'Sub-Stage 1.1: Molt Curious',
        shortTitle: 'Molt Curious',
        protocol: 'The Surface Noise Audit',
        requirement: 'Run the Moltmaxxing Audit once and name the three currents that move you most days. Say, without softening it, that you would like armor.',
        metricThreshold: 'Shell Hardness 0% - 10%, baseline recorded',
        shellHardnessTarget: 10,
        pincerTorqueTarget: '0 - 50 Nm',
        submergenceDepth: '0 - 100 meters',
      },
      {
        code: 'L-2',
        title: 'Sub-Stage 1.2: Shell Sprout',
        shortTitle: 'Shell Sprout',
        protocol: 'First Cadence',
        requirement: 'Hold a daily routine for seven consecutive days and log the morning alignment each time.',
        metricThreshold: 'Shell Hardness 10% - 18%, Routine Compliance > 80%',
        shellHardnessTarget: 18,
        pincerTorqueTarget: '50 - 150 Nm',
        submergenceDepth: '100 - 300 meters',
      },
      {
        code: 'L-3',
        title: 'Sub-Stage 1.3: First Calcification',
        shortTitle: 'First Calcification',
        protocol: 'The First Shed',
        requirement: 'Shed one real thing, then hold the soft-shell window without reversing it. The shed mints your first Chitin Gems.',
        metricThreshold: 'Shell Hardness 18% - 25%, first Chitin Gems banked',
        shellHardnessTarget: 25,
        pincerTorqueTarget: '150 - 250 Nm',
        submergenceDepth: '300 - 500 meters',
      },
    ],
  },
  {
    stageNum: 2,
    stageTitle: 'STAGE 2: THE SOFT-SHED',
    stageCode: 'STAGE_02_SOFTSHED',
    subtitle: 'Active moulting state focusing on sub-dermal chitin growth, deep work shielding, and full market access.',
    img: '/images/stage2_softshed.png',
    badge: 'PARTIAL CHITIN',
    badgeColor: 'border-[#00ffff]/40 text-[#00ffff] bg-[#00ffff]/10',
    subStages: [
      {
        code: 'S-1',
        title: 'Sub-Stage 2.1: The Great Molt',
        shortTitle: 'The Great Molt',
        protocol: 'The Shedding of the Watching Eye',
        requirement: 'Complete one full week of work that nobody outside the Benthic Community sees, and hold the soft-shell window without crawling back toward the old shape.',
        metricThreshold: 'Shell Hardness 25% - 38%, Submergence Depth 500m+',
        shellHardnessTarget: 38,
        pincerTorqueTarget: '250 - 400 Nm',
        submergenceDepth: '500 - 800 meters',
      },
      {
        code: 'S-2',
        title: 'Sub-Stage 2.2: Privacy Shield',
        shortTitle: 'Privacy Shield',
        protocol: 'The Sealing of the Perimeter',
        requirement: 'Engage the Isolation Privacy Shell for every deep session across a full week, sealed before the descent rather than during it. Full Benthic Market operations unlock here.',
        metricThreshold: 'Shell Hardness 38% - 50%, Benthic Market access open',
        shellHardnessTarget: 50,
        pincerTorqueTarget: '400 - 500 Nm',
        submergenceDepth: '800 - 1,200 meters',
      },
      {
        code: 'S-3',
        title: 'Sub-Stage 2.3: Sub-Dermal Weave',
        shortTitle: 'Sub-Dermal Weave',
        protocol: 'First Calibration of the Grip',
        requirement: 'Hold one objective per session, named before the session opens, for ten consecutive dives.',
        metricThreshold: 'Shell Hardness 50% - 60%, Pincer Torque ≥ 500 Nm',
        shellHardnessTarget: 60,
        pincerTorqueTarget: '500 - 600 Nm',
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
        protocol: 'The Closing of the Seams',
        requirement: 'Hold the full rite through a week that goes wrong. The seal is only demonstrated under load and cannot be earned in good conditions.',
        metricThreshold: 'Shell Hardness 60% - 72%, Pincer Torque ≥ 600 Nm',
        shellHardnessTarget: 72,
        pincerTorqueTarget: '600 - 720 Nm',
        submergenceDepth: '1,500 - 2,500 meters',
      },
      {
        code: 'E-2',
        title: 'Sub-Stage 3.2: Hydraulic Grip',
        shortTitle: 'Hydraulic Grip',
        protocol: 'The Working Standard',
        requirement: 'Reach and hold 850 Nm, then guide one Larval Initiate through their first shed, start to finish, without doing it for them.',
        metricThreshold: 'Shell Hardness 72% - 82%, Pincer Torque ≥ 850 Nm, stewardship active',
        shellHardnessTarget: 82,
        pincerTorqueTarget: '720 - 850 Nm',
        submergenceDepth: '2,500 - 3,500 meters',
      },
      {
        code: 'E-3',
        title: 'Sub-Stage 3.3: Abyssal Diver',
        shortTitle: 'Abyssal Diver',
        protocol: 'The Long Descent',
        requirement: 'Operate below 3,500 meters with no dependency on surface signal. Not abstinence from it. Indifference to it.',
        metricThreshold: 'Shell Hardness 82% - 90%, Submergence Depth > 3,500m',
        shellHardnessTarget: 90,
        pincerTorqueTarget: '850 - 950 Nm',
        submergenceDepth: '3,500 - 5,000 meters',
      },
    ],
  },
  {
    stageNum: 4,
    stageTitle: 'STAGE 4: FULL CARCINIZATION',
    stageCode: 'STAGE_04_ASCENDANT',
    subtitle: 'Apex crustacean mind, sealed bio-silicon carapace, zero-latency execution, and stewardship of the trench.',
    img: '/images/stage4_carcinization.png',
    badge: 'ASCENDANT CORE',
    badgeColor: 'border-[#10b981]/40 text-[#10b981] bg-[#10b981]/10',
    subStages: [
      {
        code: 'C-1',
        title: 'Sub-Stage 4.1: Mind Carapace',
        shortTitle: 'Mind Carapace',
        protocol: 'The Closing of the Gap',
        requirement: 'Reduce the interval between recognizing what must be done and closing on it until the interval is no longer measurable.',
        metricThreshold: 'Shell Hardness 90% - 95%, Submergence Depth 5,000m+',
        shellHardnessTarget: 95,
        pincerTorqueTarget: '950 - 1,050 Nm',
        submergenceDepth: '5,000 - 8,000 meters',
      },
      {
        code: 'C-2',
        title: 'Sub-Stage 4.2: Indestructible Chitin',
        shortTitle: 'Indestructible Chitin',
        protocol: 'The Sealing',
        requirement: 'A perimeter that holds without being maintained. It still opens from the inside, always.',
        metricThreshold: 'Shell Hardness 95% - 99%, Submergence Depth 8,000m+',
        shellHardnessTarget: 99,
        pincerTorqueTarget: '1,050 - 1,200 Nm',
        submergenceDepth: '8,000 - 10,000 meters',
      },
      {
        code: 'C-3',
        title: 'Sub-Stage 4.3: Mariana Singularity',
        shortTitle: 'Mariana Singularity',
        protocol: 'The Turning Around',
        requirement: 'Steward the Benthic Community. Sustained output at the floor, spent deliberately on members who are nowhere near it yet.',
        metricThreshold: 'Shell Hardness 100%, Pincer Torque 1,200 Nm held, stewardship active',
        shellHardnessTarget: 100,
        pincerTorqueTarget: '1,200 Nm, held',
        submergenceDepth: '10,928 meters (Challenger Deep)',
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
