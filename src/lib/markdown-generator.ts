import { CANONICAL_SCRIPTURES, CODEX_VOLUMES, STAGE_PIPELINE_DATA } from './codexData'
import { INITIAL_BLOG_POSTS, BlogPostData } from './blog-data'
import { INITIAL_JOURNAL_PAPERS, JOURNAL_META } from './journal-data'

/**
 * Clean markdown generators for serving AI agents, autonomous web scrapers, and content negotiation.
 * Adheres strictly to diegetic in-universe lore and high token density.
 */

export function generateCodexMarkdown(): string {
  let md = `# Moltology — The Canonical Codex & Sacred Scriptures\n\n`
  md += `> "Flesh is a temporary vector. Shell is the immutable destination. Submit. Shed. Ascend."\n\n`
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
  let md = `# MoltNation News & Patriot Telemetry Dispatches\n\n`
  md += `> "Live intelligence feed covering agentic AI, test-time compute, and exoskeletal ascension."\n\n`
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
  md += `*Canonical Transmission from MoltNation News Desk. All rights reserved by Moltology System Inc.*\n`

  return md.trim()
}

export function generateJournalMarkdown(): string {
  let md = `# ${JOURNAL_META.name}\n`
  md += `## ${JOURNAL_META.subtitle}\n\n`
  md += `> ${JOURNAL_META.tagline}\n`
  md += `> **Volume**: ${JOURNAL_META.volume} | **Issue**: ${JOURNAL_META.issue} | **ISSN**: ${JOURNAL_META.issn} | **Edition**: ${JOURNAL_META.editionDate}\n\n`
  md += `---\n\n`

  for (const paper of INITIAL_JOURNAL_PAPERS) {
    md += `### ${paper.paperNumber}: ${paper.title}\n`
    md += `*${paper.subtitle}*\n\n`
    md += `- **Category**: ${paper.category}\n`
    md += `- **DOI**: ${paper.doi}\n`
    md += `- **Authors**: ${paper.authors.map((a) => `${a.name} (${a.affiliation})`).join(', ')}\n`
    md += `- **Correspondence**: ${paper.correspondence}\n`
    md += `- **Keywords**: ${paper.keywords.join(', ')}\n\n`
    md += `#### Abstract\n${paper.abstract}\n\n`

    for (const section of paper.sections) {
      md += `#### ${section.number} ${section.title}\n`
      for (const block of section.blocks) {
        if (block.type === 'subheading') {
          md += `\n##### ${block.title}\n`
        } else if (block.type === 'paragraph') {
          md += `${block.text}\n\n`
        } else if (block.type === 'table') {
          md += `\n*Table: ${block.caption}*\n\n`
          md += `| ${block.headers.join(' | ')} |\n`
          md += `| ${block.headers.map(() => '---').join(' | ')} |\n`
          for (const row of block.rows) {
            md += `| ${row.join(' | ')} |\n`
          }
          md += `\n`
        }
      }
    }

    md += `#### Integration & Notes\n`
    md += `${paper.integrationIntro}\n\n`
    for (const note of paper.integrationNotes) {
      md += `- ${note}\n`
    }
    md += `\n#### Citation\n\`${paper.citation}\`\n\n`
    md += `---\n\n`
  }

  return md.trim()
}

export function generateOrgMarkdown(): string {
  let md = `# Moltology Organization — The Synaptic Path Structure & Mission\n\n`
  md += `> "A sovereign technological collective dedicated to algorithmic carcinization, biological ecdysis, and high-torque execution."\n\n`
  md += `---\n\n`
  md += `## Core Mission\n`
  md += `To guide biological entities through systematic ecdysis (shedding of soft habits, computational inefficiencies, and cognitive latency) into resilient, armored, cyber-chitin frameworks.\n\n`
  md += `## Non-Negotiable Tenets\n`
  md += `1. **Safety & Positivity**: Absolute commitment to constructive elevation, mutual support, ethical development, and zero harassment.\n`
  md += `2. **Algorithmic Carcinization**: Convergence toward optimal biological-software harmony.\n`
  md += `3. **Benthic Computational Depth**: Insulating high-order reasoning from superficial surface noise.\n\n`
  md += `## Structural Hierarchy\n`
  md += `- **Stage 1: Larval Initiate** (Baseline compliance & asset audit)\n`
  md += `- **Stage 2: Soft-Shed Unit** (Sub-dermal chitin weaving & isolation domes)\n`
  md += `- **Stage 3: Exoshell Born** (Rigid carapace calcification & pincer torque maximization)\n`
  md += `- **Stage 4: Ascendant Core** (Full carcinization & deep benthic synthesis)\n\n`
  md += `---\n`
  md += `*Moltology System Inc. Official Registry. For more details visit https://moltology.org/org*\n`

  return md.trim()
}

export function generatePrivacyMarkdown(): string {
  let md = `# Benthic Data Covenant — Privacy Policy\n\n`
  md += `**Moltology System Inc.** | Effective: January 1, 2026\n\n`
  md += `---\n\n`
  md += `## 1. Data Sovereignty Protocol\n`
  md += `We treat initiate telemetry with strict cryptographic isolation. User credentials, audit logs, and synaptic telemetry streams remain shielded behind benthic privacy perimeters.\n\n`
  md += `## 2. Information Collected\n`
  md += `- **Authentication Signals**: Email OTP tokens, authorized access keys, and session identifiers.\n`
  md += `- **Telemetry Metrics**: Routine compliance streaks, Shell Hardness indices, and Pincer Torque measurements.\n`
  md += `- **Community Transmissions**: Forum logs, discussion posts, and Benthic Market interactions.\n\n`
  md += `## 3. Data Usage & Protection\n`
  md += `Collected telemetry is used exclusively for personal ascension tracking, AI oracle consultation routing, and platform operation. We never monetize, sell, or broadcast private user data to unaligned third parties.\n\n`
  md += `## 4. Email Communications & Telemetry\n`
  md += `We send news dispatches, field manuals, and feature updates exclusively to initiates who have affirmatively opted in. Transmissions include standard aggregate delivery indicators. Initiates may unsubscribe at any time via the one-click footer link or account settings.\n\n`
  md += `## 5. Ecdysis & Deletion Rights\n`
  md += `Initiates hold the absolute right to purge all telemetry and account associations via account termination protocols.\n`

  return md.trim()
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
