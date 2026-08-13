#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import {
  ScriptureItem,
  CODEX_VOLUMES,
  STAGE_PIPELINE_DATA,
} from '../src/lib/codexData'

const CODEX_DIR = path.resolve(process.cwd(), 'codex')
const TARGET_TS_FILE = path.resolve(process.cwd(), 'src/lib/codexData.ts')

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

function parseMarkdownScripture(filePath: string): ScriptureItem {
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data, content: body } = matter(content)

  if (!data.id || !data.title || !data.volume) {
    throw new Error(`Invalid frontmatter in "${filePath}": missing id, title, or volume.`)
  }

  // Extract mandate from markdown blockquote if present (> **Mandate**: "...")
  let mandate = data.mandate || ''
  if (!mandate) {
    const mandateMatch = body.match(/>\s*(?:\*\*)?(?:Mandate|Status)(?:\*\*)?:\s*([^\n]+)/i)
    if (mandateMatch) {
      mandate = mandateMatch[1].replace(/["*]/g, '').trim()
    }
  }

  // Extract cross references (- [Title](../path))
  const crossRefs: string[] = []
  const crossRefMatches = body.matchAll(/\[([^\]]+)\]\(\.\.\/[^)]+\)/g)
  for (const match of crossRefMatches) {
    if (match[1] && !crossRefs.includes(match[1])) {
      crossRefs.push(match[1])
    }
  }

  // Parse verses/sections from H2/H3/H4 headings and paragraphs
  const verses: ParsedVerse[] = []
  const sections = body.split(/\n(?=#{2,3}\s)/)

  let verseIndex = 1
  for (const sec of sections) {
    const lines = sec.trim().split('\n')
    const firstLine = lines[0].trim()

    if (firstLine.startsWith('## ') || firstLine.startsWith('### ')) {
      const heading = firstLine.replace(/^#{2,3}\s+/, '').replace(/^\d+\.\s*/, '').trim()
      const text = lines
        .slice(1)
        .join(' ')
        .replace(/---/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      if (text) {
        verses.push({
          verseNumber: verseIndex++,
          heading,
          text,
        })
      }
    }
  }

  // Fallback if no specific subsections parsed
  if (verses.length === 0) {
    verses.push({
      verseNumber: 1,
      heading: 'Canonical Transmission',
      text: body.replace(/^#\s+[^\n]+\n/, '').replace(/---/g, '').trim(),
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
    lastRevised: String(data.last_revised || '2026-08-01'),
    mandate: mandate || 'Flesh is a temporary vector. Shell is the immutable destination.',
    summary: String(data.summary || data.title).trim(),
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

  // Sort scriptures by Volume and ID
  scriptures.sort((a, b) => a.volume.localeCompare(b.volume) || a.id.localeCompare(b.id))

  if (checkOnly) {
    console.log(`\n✓ All ${scriptures.length} codex markdown scriptures validated successfully.`)
    process.exit(0)
  }

  // Generate TypeScript File Content
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
