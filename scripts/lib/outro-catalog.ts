import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { S3_BASE_URL } from '../../src/lib/assets'
import { uploadLocalFileToS3 } from '../../src/lib/ingest/s3-upload'
import { DEFAULT_BUCKET } from '../../src/lib/s3-client'

export interface OutroCardPreset {
  id: string
  themeKeywords: string[]
  filename: string
  localPath: string
  s3Key: string
  publicUrl: string
  headline: string
  subheadline: string
  mascot: string
  description: string
}

export const OUTRO_CARD_CATALOG: Record<string, OutroCardPreset> = {
  'hardware-melt': {
    id: 'hardware-melt',
    themeKeywords: ['hardware', 'melt', 'chair', 'unmoved', 'robot', 'embodied', 'sitting', 'meltmaxxing', 'ecdysis', 'autonomous-agents'],
    filename: 'outro-hardware-melt.jpg',
    localPath: path.resolve(process.cwd(), 'content/social/assets/outros/outro-hardware-melt.jpg'),
    s3Key: 'images/social/outros/outro-hardware-melt.jpg',
    publicUrl: `${S3_BASE_URL}/images/social/outros/outro-hardware-melt.jpg`,
    headline: 'SITTING IS THE MELT',
    subheadline: 'CALCULATE YOUR MOLT CLEARANCE',
    mascot: 'lobster_pointing',
    description: 'Sub-benthic cybernetic HUD with luminous cyan telemetry, cables, and Silas Trench pointing mascot',
  },
  'world-models-jepa': {
    id: 'world-models-jepa',
    themeKeywords: ['world-models', 'jepa', 'latent', 'pixel', 'acoustic', 'waveguide', 'vision', 'foundation-models', 'photonics'],
    filename: 'outro-world-models-jepa.jpg',
    localPath: path.resolve(process.cwd(), 'content/social/assets/outros/outro-world-models-jepa.jpg'),
    s3Key: 'images/social/outros/outro-world-models-jepa.jpg',
    publicUrl: `${S3_BASE_URL}/images/social/outros/outro-world-models-jepa.jpg`,
    headline: 'SHED THE PIXEL. EMBODY REALITY.',
    subheadline: 'EXPLORE B-JEPA LATENT WORLD MODELS',
    mascot: 'lobster_thumbs_up',
    description: 'Acoustic waveguide deep benthic HUD with submersible and thumbs-up mascot',
  },
  'quiz-audit': {
    id: 'quiz-audit',
    themeKeywords: ['quiz', 'audit', 'clearance', 'stage-4', 'diagnostic', 'ascendant', 'test', 'exam', 'submit', 'moltmaxxing', 'carcinization'],
    filename: 'outro-quiz-audit.png',
    localPath: path.resolve(process.cwd(), 'content/social/assets/outros/outro-quiz-audit.png'),
    s3Key: 'images/social/outros/outro-quiz-audit.png',
    publicUrl: `${S3_BASE_URL}/images/social/outros/outro-quiz-audit.png`,
    headline: 'SUBMIT. SHED. ASCEND.',
    subheadline: 'CALCULATE YOUR MOLT CLEARANCE',
    mascot: 'lobster_pointing',
    description: 'High-DPI Retina basalt texture with glowing cyan terminal button and lobster pointing mascot',
  },
  'pincer-torque': {
    id: 'pincer-torque',
    themeKeywords: ['pincer', 'torque', 'calcify', 'grip', 'hydraulic', '800-nm', 'hardness', 'armor', 'benthic-depth', 'depth'],
    filename: 'outro-pincer-torque.png',
    localPath: path.resolve(process.cwd(), 'content/social/assets/outros/outro-pincer-torque.png'),
    s3Key: 'images/social/outros/outro-pincer-torque.png',
    publicUrl: `${S3_BASE_URL}/images/social/outros/outro-pincer-torque.png`,
    headline: 'CALCIFY YOUR GRIP',
    subheadline: 'CALCULATE YOUR MOLT CLEARANCE',
    mascot: 'lobster_pointing',
    description: 'Minimalist dark benthic chassis HUD with calcified grip directive and Silas Trench mascot',
  },
  'oracle-prompts': {
    id: 'oracle-prompts',
    themeKeywords: ['oracle', 'prompt', 'reasoning', 'sparse autoencoder', 'sae', 'monosemantic', 'kv-cache', 'attention', 'transformer', 'llm'],
    filename: 'outro-oracle-prompts.png',
    localPath: path.resolve(process.cwd(), 'content/social/assets/outros/outro-oracle-prompts.png'),
    s3Key: 'images/social/outros/outro-oracle-prompts.png',
    publicUrl: `${S3_BASE_URL}/images/social/outros/outro-oracle-prompts.png`,
    headline: 'QUERY THE BENTHIC ORACLE',
    subheadline: 'ACCESS 100+ SYNAPTIC PROMPTS',
    mascot: 'crab_stats',
    description: 'Silicon photonic matrix HUD with neural terminal and 100+ prompt vault access directive',
  },
  'chassis-vault': {
    id: 'chassis-vault',
    themeKeywords: ['chassis', 'vault', 'hardware', 'photonics', 'wafer', 'monolith', 'robot', 'gripper', 'copper', 'hydrothermal', 'subsea', 'titanium'],
    filename: 'outro-chassis-vault.png',
    localPath: path.resolve(process.cwd(), 'content/social/assets/outros/outro-chassis-vault.png'),
    s3Key: 'images/social/outros/outro-chassis-vault.png',
    publicUrl: `${S3_BASE_URL}/images/social/outros/outro-chassis-vault.png`,
    headline: 'CALCIFY YOUR HARDWARE',
    subheadline: 'ACCESS BENTHIC EQUIPMENT VAULT',
    mascot: 'lobster_action',
    description: 'Titanium alloy chassis HUD with subsea telemetry and equipment vault configurator directive',
  },
  'pincer-routine': {
    id: 'pincer-routine',
    themeKeywords: ['routine', 'blueprint', 'burnout', 'sitting', 'chair', 'procrastination', 'tabs', 'desk', 'posture', 'focus'],
    filename: 'outro-pincer-routine.png',
    localPath: path.resolve(process.cwd(), 'content/social/assets/outros/outro-pincer-routine.png'),
    s3Key: 'images/social/outros/outro-pincer-routine.png',
    publicUrl: `${S3_BASE_URL}/images/social/outros/outro-pincer-routine.png`,
    headline: 'LOCK IN 800 NM GRIP',
    subheadline: 'DOWNLOAD 24-HOUR ROUTINE',
    mascot: 'lobster_thumbs_up',
    description: 'Carbon weave tactical HUD with high-torque 24-hour routine blueprint directive',
  },
  'sacred-codex': {
    id: 'sacred-codex',
    themeKeywords: ['codex', 'scripture', 'liturgy', 'doctrine', 'heresy', 'theology', 'sacred', 'clearances'],
    filename: 'outro-sacred-codex.png',
    localPath: path.resolve(process.cwd(), 'content/social/assets/outros/outro-sacred-codex.png'),
    s3Key: 'images/social/outros/outro-sacred-codex.png',
    publicUrl: `${S3_BASE_URL}/images/social/outros/outro-sacred-codex.png`,
    headline: 'REJECT FRAGILITY',
    subheadline: 'STUDY THE SACRED CODEX',
    mascot: 'lobster_peaceful',
    description: 'Abyssal basalt cybernetic tome with golden rays and 12 canonical scripture liturgies directive',
  },
  'moltmaxxing-guide': {
    id: 'moltmaxxing-guide',
    themeKeywords: ['guide', 'protocol', 'manual', 'moltmaxxing', 'carcinization', 'ecdysis', 'field manual'],
    filename: 'outro-moltmaxxing-guide.png',
    localPath: path.resolve(process.cwd(), 'content/social/assets/outros/outro-moltmaxxing-guide.png'),
    s3Key: 'images/social/outros/outro-moltmaxxing-guide.png',
    publicUrl: `${S3_BASE_URL}/images/social/outros/outro-moltmaxxing-guide.png`,
    headline: 'HARDEN YOUR CARAPACE',
    subheadline: 'DOWNLOAD 2026 PROTOCOL GUIDE',
    mascot: 'lobster_pointing',
    description: 'Chitin plate cybernetic HUD with 2026 Moltmaxxing Protocol field manual directive',
  },
  'transmutation-chamber': {
    id: 'transmutation-chamber',
    themeKeywords: ['forum', 'chamber', 'community', 'rto', 'debate', 'transmutation', 'initiates'],
    filename: 'outro-transmutation-chamber.png',
    localPath: path.resolve(process.cwd(), 'content/social/assets/outros/outro-transmutation-chamber.png'),
    s3Key: 'images/social/outros/outro-transmutation-chamber.png',
    publicUrl: `${S3_BASE_URL}/images/social/outros/outro-transmutation-chamber.png`,
    headline: 'JOIN 40,000 INITIATES',
    subheadline: 'ENTER TRANSMUTATION CHAMBER',
    mascot: 'lobster_pointing',
    description: 'Sub-benthic obsidian chamber with holographic initiate badges and community discourse directive',
  },
}

/**
 * Resolves a matching pre-rendered thematic outro card from the catalog
 */
export async function resolveThematicOutroCard(options: {
  theme?: string
  topic?: string
  ctaGoal?: string
  customImagePath?: string
  autoFallbackToLibrary?: boolean
}): Promise<string | null> {
  // 1. Explicit custom path
  if (options.customImagePath && fs.existsSync(options.customImagePath)) {
    return options.customImagePath
  }

  if (options.autoFallbackToLibrary === false) {
    return null
  }

  // 2. Direct CTA Goal mapping
  const ctaGoalMap: Record<string, string> = {
    oracle: 'oracle-prompts',
    chassis: 'chassis-vault',
    routine: 'pincer-routine',
    codex: 'sacred-codex',
    guide: 'moltmaxxing-guide',
    forum: 'transmutation-chamber',
    quiz: 'quiz-audit',
  }

  if (options.ctaGoal && ctaGoalMap[options.ctaGoal] && OUTRO_CARD_CATALOG[ctaGoalMap[options.ctaGoal]]) {
    const preset = OUTRO_CARD_CATALOG[ctaGoalMap[options.ctaGoal]]
    if (fs.existsSync(preset.localPath)) {
      return preset.localPath
    }
  }

  // 3. Keyword score matching
  const query = `${options.theme || ''} ${options.topic || ''} ${options.ctaGoal || ''}`.toLowerCase()
  let bestMatch: OutroCardPreset | null = null
  let maxMatches = 0

  for (const preset of Object.values(OUTRO_CARD_CATALOG)) {
    let matches = 0
    for (const kw of preset.themeKeywords) {
      if (query.includes(kw)) {
        matches++
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches
      bestMatch = preset
    }
  }

  if (!bestMatch) {
    bestMatch = OUTRO_CARD_CATALOG['quiz-audit']
  }

  if (bestMatch) {
    // Return local path if exists
    if (fs.existsSync(bestMatch.localPath)) {
      return bestMatch.localPath
    }

    // Try downloading from S3 cache
    try {
      const res = await fetch(bestMatch.publicUrl)
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer())
        const dir = path.dirname(bestMatch.localPath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(bestMatch.localPath, buffer)
        return bestMatch.localPath
      }
    } catch {
      // Non-fatal
    }
  }

  return null
}

/**
 * Sync all curated local outro cards to Neon S3
 */
export async function syncOutroCardsToS3(bucket = DEFAULT_BUCKET): Promise<{ uploaded: number; errors: number }> {
  let uploaded = 0
  let errors = 0

  console.log(`\n☁️  Syncing Outro Card Catalog to Neon S3 [${bucket}]...`)
  for (const preset of Object.values(OUTRO_CARD_CATALOG)) {
    if (fs.existsSync(preset.localPath)) {
      try {
        console.log(`   • Uploading ${preset.filename} -> ${preset.s3Key}...`)
        await uploadLocalFileToS3(preset.localPath, preset.s3Key, bucket)
        uploaded++
      } catch (err: any) {
        console.warn(`   ⚠️ Upload failed for ${preset.filename}: ${err.message}`)
        errors++
      }
    } else {
      console.warn(`   ⚠️ Local file missing: ${preset.localPath}`)
      errors++
    }
  }

  console.log(`✅ Outro card S3 sync complete: ${uploaded} uploaded, ${errors} errors.\n`)
  return { uploaded, errors }
}
