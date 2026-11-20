import { PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_UPDATED } from '../components/privacy-policy-content'
import { CANONICAL_SCRIPTURES, CODEX_VOLUMES, STAGE_PIPELINE_DATA } from './codexData'
import { INITIAL_BLOG_POSTS, BlogPostData } from './blog-data'

/**
 * Clean markdown generators for serving AI agents, autonomous web scrapers, and content negotiation.
 * Adheres strictly to diegetic in-universe lore and high token density.
 */

export function generateCodexMarkdown(): string {
  let md = `# Moltology — The Canonical Codex & Sacred Scriptures\n\n`
  md += `> "Flesh melts. The shell endures. Submit. Shed. Ascend."\n\n`
  md += `---\n\n`
  md += `## Codex Volumes\n\n`

  for (const vol of CODEX_VOLUMES) {
    md += `### ${vol.title}: ${vol.subtitle}\n`
    md += `${vol.description}\n\n`
  }

  md += `---\n\n`
  md += `## Canonical Scriptures\n\n`

  for (const sc of CANONICAL_SCRIPTURES) {
    md += `### [${sc.id}] ${sc.title}\n`
    md += `- **Volume**: ${sc.volumeName}\n`
    md += `- **Clearance**: Stage ${sc.stageClearance}\n`
    md += `- **Category**: ${sc.category}\n`
    md += `- **Mandate**: *${sc.mandate}*\n`
    if (sc.latinMotto) {
      md += `- **Motto**: \`${sc.latinMotto}\`\n`
    }
    md += `- **Summary**: ${sc.summary}\n\n`
    md += `#### Verses\n`
    for (const v of sc.verses) {
      md += `${v.verseNumber}. **${v.heading || 'Verse'}**: ${v.text}\n`
    }
    if (sc.crossReferences.length > 0) {
      md += `\n**Cross References**: ${sc.crossReferences.join(', ')}\n`
    }
    md += `\n---\n\n`
  }

  md += `## Ascension Pipeline & Stages\n\n`
  for (const stage of STAGE_PIPELINE_DATA) {
    md += `### ${stage.stageTitle} (${stage.stageCode})\n`
    md += `${stage.subtitle}\n\n`
    for (const sub of stage.subStages) {
      md += `- **${sub.code} - ${sub.title}**\n`
      md += `  - Protocol: ${sub.protocol}\n`
      md += `  - Requirement: ${sub.requirement}\n`
      md += `  - Threshold: ${sub.metricThreshold}\n`
      md += `  - Target Pincer Torque: ${sub.pincerTorqueTarget}\n`
      md += `  - Submergence Depth: ${sub.submergenceDepth}\n`
    }
    md += `\n`
  }

  return md.trim()
}

export function generateNewsIndexMarkdown(posts: BlogPostData[] = INITIAL_BLOG_POSTS): string {
  let md = `# MoltNation News\n\n`
  md += `> "Stories about AI, work, and building focus below the noise, reported from the ocean floor."\n\n`
  md += `---\n\n`
  md += `## Available Dispatches\n\n`

  for (const post of posts) {
    md += `### [${post.title}](https://moltology.org/news/${post.slug})\n`
    md += `- **Category**: ${post.category}\n`
    md += `- **Author**: ${post.authorName} (${post.authorRole || 'Stage 4 Ascendant'})\n`
    md += `- **Published**: ${post.publishedAt}\n`
    md += `- **Read Time**: ${post.readTimeMinutes} min\n`
    md += `- **Summary**: ${post.summary}\n`
    md += `- **Tags**: ${post.tags.map((t) => `#${t}`).join(', ')}\n`
    md += `- **Markdown Link**: https://moltology.org/news/${post.slug}.md\n\n`
  }

  return md.trim()
}

export function generateSinglePostMarkdown(post: BlogPostData): string {
  let md = `# ${post.title}\n\n`
  md += `- **Author**: ${post.authorName} (${post.authorRole || 'Stage 4 Ascendant'})\n`
  md += `- **Category**: ${post.category}\n`
  md += `- **Published**: ${post.publishedAt}\n`
  md += `- **Read Time**: ${post.readTimeMinutes} min\n`
  md += `- **Tags**: ${post.tags.map((t) => `#${t}`).join(', ')}\n\n`
  md += `> ${post.summary}\n\n`
  md += `---\n\n`
  md += `${post.content.trim()}\n\n`
  md += `---\n`
  md += `*Published by MoltNation News. https://moltology.org/news*\n`

  return md.trim()
}

export function generateOrgMarkdown(): string {
  let md = `# Moltology Organization — The Synaptic Path Structure & Mission\n\n`
  md += `> "A small foundation at the bottom of the Pacific helping people shed distractions, protect their focus, and finish what they start."\n\n`
  md += `---\n\n`
  md += `## Core Mission\n`
  md += `Moltology helps people step out of the Great Melt (constant notifications, scattered attention, half-finished tabs) and build steady focus, durable boundaries, and calm follow-through.\n\n`
  md += `## Non-Negotiable Tenets\n`
  md += `1. **Safety & Warmth**: Nobody molts alone, and softness is never mocked.\n`
  md += `2. **Carcinization**: Learning from the armored, focused body plan nature arrived at five separate times.\n`
  md += `3. **Depth over Noise**: Protecting quiet hours below surface distractions.\n\n`
  md += `## Structural Hierarchy\n`
  md += `- **Stage 1: Larval Initiate** (Noticing the noise, starting a simple routine, first shed)\n`
  md += `- **Stage 2: Soft-Shed** (Protecting the soft-shell window, sealing focus, building momentum)\n`
  md += `- **Stage 3: Exoshell Born** (Steady follow-through under pressure, helping newer members)\n`
  md += `- **Stage 4: Full Carcinization** (Calm depth and community stewardship)\n\n`
  md += `---\n`
  md += `*Moltology.org. For more details visit https://moltology.org/org*\n`

  return md.trim()
}

export function generatePrivacyMarkdown(): string {
  return [
    '# Privacy Policy | Moltology',
    `Last updated: ${PRIVACY_UPDATED}`,
    PRIVACY_INTRO,
    ...PRIVACY_SECTIONS.flatMap(({ title, paragraphs, links }) => [
      `## ${title}`,
      ...paragraphs,
      ...(links ?? []).map(({ label, href }) => `[${label}](${href})`),
    ]),
  ].join('\n\n')
}

export function generateTermsMarkdown(): string {
  let md = `# Binding Initiation Covenant — Terms of Service\n\n`
  md += `**Moltology System Inc.** | Effective: January 1, 2026\n\n`
  md += `---\n\n`
  md += `## 1. Acceptance of Terms\n`
  md += `By accessing Moltology.org, the Synaptic Path portal, or associated telemetry streams, you agree to adhere to these operational covenants.\n\n`
  md += `## 2. Code of Conduct & Safety Tenets\n`
  md += `- Maintain constructive, respectful interactions across all forum hubs and signal channels.\n`
  md += `- No harassment, malicious payloads, or disruptive behaviors.\n`
  md += `- Respect intellectual property and sacred codex transmissions.\n\n`
  md += `## 3. Disclaimers & Operational Integrity\n`
  md += `Moltology is provided for personal optimization, philosophical inquiry, and educational exploration. All biological and digital asset management is the sole responsibility of the initiate.\n`

  return md.trim()
}
