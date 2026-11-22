/**
 * Content and SEO rules for the benefit landing pages (src/lib/benefits/). Used by
 * `npm run benefits:check` and its test, so CI and Codex runs hit the same rules.
 */
import type { BenefitPage, BenefitSummary } from '../../src/lib/benefits/types'

export interface BenefitIssue {
  slug: string
  rule: string
  message: string
  /** Warnings never fail the run; errors do. */
  level: 'error' | 'warning'
}

/** Topics that imitate health or money sites must carry a plain disclaimer line. */
export const SENSITIVE_TOPICS = new Set(['libido', 'hardness', 'sexy', 'financial', 'investing', 'generational'])

/** Lines Myles asked to keep out of copy, and AI tells that make pages read as generated. */
export const BANNED_PHRASES = [
  'earned only',
  'can never be bought',
  'unlock your potential',
  'game-changer',
  'game changer',
  'elevate your',
  'in today’s fast-paced',
  "in today's fast-paced",
  'seamless',
  'delve',
]

/**
 * FAQs answer the page's search topic. Cost, sign-up and demo questions are answered once by
 * the reveal, so they never repeat across 48 FAQPage blocks.
 */
export const FAQ_INTENT_BANNED =
  /\b(cost|costs|free|fees?|price|pricing|trial|demo|preview|sandbox|try it|try a|look around|before (i|signing|joining)|read before|see it before)\b/i

/** Claims the skill bans: invented member outcomes, promises and overreach. */
export const CLAIM_BANS: { pattern: RegExp; why: string }[] = [
  { pattern: /\b(most|many|plenty of) (members|people|users)\b/i, why: 'invents what members do or feel' },
  { pattern: /\bwithin (the )?first (week|month|days?)\b/i, why: 'promises a timeline' },
  { pattern: /\byou(’ll|'ll| will) (feel|see|notice|become|get|have|be|gain|wake|sleep|look|find|finally|never again)\b/i, why: 'promises an outcome (describe what the practice asks instead)' },
  { pattern: /\b(safest|guaranteed?|proven|clinically|scientifically)\b/i, why: 'overclaims' },
  { pattern: /\bonly paid\b/i, why: 'wrong: Molt Credits and the store are paid too' },
  { pattern: /\bthis page (borrows|uses|wears)\b/i, why: 'explains the costume (BAN 6)' },
  { pattern: /\b(the look of|dressed (up )?as) an? \w+ (site|brand|app|house|event)\b/i, why: 'explains the costume (BAN 6)' },
]

/** Reveal headlines that every page reached for first. One page may use a shape, never two. */
export const REVEAL_SHAPES = [/was a (costume|metaphor)/i, /was borrowed/i, /\bis (real|an app)\b/i]

export const LIMITS = {
  titleMax: 60,
  descriptionMin: 110,
  descriptionMax: 160,
  faqMin: 5,
  faqMax: 12,
  relatedMin: 2,
  /** Words of copy unique to the page (content, FAQ, hook, reveal). */
  wordsMin: 450,
  /** A sentence this long that appears on two pages is duplicate copy. */
  sharedSentenceWords: 7,
}

/** Every string in a value, depth first, skipping image paths and links. */
export function collectText(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    if (!value.startsWith('/') && !/^https?:/.test(value)) out.push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) collectText(item, out)
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === 'src' || key === 'href' || key === 'slug' || key === 'kit' || key === 'tone' || key === 'screenshot') continue
      collectText(item, out)
    }
  }
  return out
}

/** The copy a reader sees on the page, as plain text. */
export function pageCopy(page: BenefitPage): string {
  return collectText([page.content, page.faqs, page.hook.text, page.reveal, page.disclaimer]).join('\n')
}

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9’']+/g) ?? []
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n/)
    .map((sentence) => sentence.trim().toLowerCase().replace(/[“”"]/g, ''))
    .filter((sentence) => words(sentence).length >= LIMITS.sharedSentenceWords)
}

export function checkBenefitPages(
  summaries: BenefitSummary[],
  pages: BenefitPage[],
  options: { imageExists?: (src: string) => boolean } = {},
): BenefitIssue[] {
  const issues: BenefitIssue[] = []
  const add = (slug: string, rule: string, message: string, level: BenefitIssue['level'] = 'error') =>
    issues.push({ slug, rule, message, level })
  const bySlug = new Map(pages.map((page) => [page.slug, page]))
  const summarySlugs = new Set(summaries.map((summary) => summary.slug))

  for (const summary of summaries) {
    const page = bySlug.get(summary.slug)
    if (!page) {
      add(summary.slug, 'missing-page', `No page file at src/lib/benefits/pages/${summary.slug}.ts`)
      continue
    }
    for (const key of ['topic', 'kit', 'indexed', 'updated'] as const) {
      if (summary[key] !== page[key]) add(page.slug, 'summary-drift', `summaries.ts ${key} is "${summary[key]}" but the page says "${page[key]}"`)
    }
  }
  for (const page of pages) {
    if (!summarySlugs.has(page.slug)) add(page.slug, 'unlisted-page', 'Page file is not listed in summaries.ts')
  }

  const sentenceOwners = new Map<string, string>()
  const hookOwners = new Map<string, string>()
  const faqShapes = new Map<string, Set<string>>()
  const revealShapes = new Map<number, string[]>()

  for (const page of pages) {
    const { slug } = page
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) add(slug, 'slug', 'Slug must be lowercase words joined by hyphens')
    if (page.title.length > LIMITS.titleMax) add(slug, 'title-length', `Title is ${page.title.length} characters (max ${LIMITS.titleMax})`)
    if (!page.title.endsWith('| Moltology')) add(slug, 'title-brand', 'Title should end with "| Moltology"')
    const descriptionLength = page.description.length
    if (descriptionLength < LIMITS.descriptionMin || descriptionLength > LIMITS.descriptionMax) {
      add(slug, 'description-length', `Description is ${descriptionLength} characters (want ${LIMITS.descriptionMin} to ${LIMITS.descriptionMax})`)
    }

    const queryWords = words(page.query).filter((word) => word.length > 3)
    const headline = 'hero' in page.content ? page.content.hero.headline : ''
    const findable = `${page.title} ${page.description} ${headline}`.toLowerCase()
    const missing = queryWords.filter((word) => !findable.includes(word))
    if (queryWords.length && missing.length === queryWords.length) {
      add(slug, 'query', `None of the target query words (${page.query}) are in the title, description or headline`)
    }

    const headlineWords = words(headline)
    const coveredInHeadline = queryWords.filter((word) => headlineWords.some((h) => h.startsWith(word.slice(0, 5))))
    if (queryWords.length && coveredInHeadline.length * 2 < queryWords.length) {
      add(slug, 'query-headline', `The H1 should carry at least half of the query words (${page.query})`)
    }

    for (const faq of page.faqs) {
      if (FAQ_INTENT_BANNED.test(faq.question)) {
        add(slug, 'faq-intent', `"${faq.question}" belongs to the reveal (cost, sign-up, demo); ask about the topic instead`)
      }
      const shape = words(faq.question).slice(0, 4).join(' ')
      if (!faqShapes.has(shape)) faqShapes.set(shape, new Set())
      faqShapes.get(shape)!.add(slug)
    }
    const topicFaqs = page.faqs.filter((faq) => queryWords.some((word) => faq.question.toLowerCase().includes(word.slice(0, 5))))
    if (topicFaqs.length < 2) add(slug, 'faq-topic', 'At least two FAQ questions should use the search topic\'s words')

    REVEAL_SHAPES.forEach((pattern, index) => {
      if (pattern.test(page.reveal.headline)) revealShapes.set(index, [...(revealShapes.get(index) ?? []), slug])
    })

    const hookKey = page.hook.href
    const hookOwner = hookOwners.get(hookKey)
    if (hookOwner) add(slug, 'hook-reused', `Hook ${hookKey} is already used by ${hookOwner}; pick another real feature`)
    else hookOwners.set(hookKey, slug)

    if (page.faqs.length < LIMITS.faqMin || page.faqs.length > LIMITS.faqMax) {
      add(slug, 'faq-count', `${page.faqs.length} FAQs (want ${LIMITS.faqMin} to ${LIMITS.faqMax})`)
    }

    if (page.related.length < LIMITS.relatedMin) add(slug, 'related', `Link at least ${LIMITS.relatedMin} other benefit pages`)
    for (const related of page.related) {
      if (related === slug) add(slug, 'related', 'A page cannot list itself as related')
      else if (!summarySlugs.has(related)) add(slug, 'related', `Related page "${related}" does not exist`)
    }

    if (!page.hook.href.startsWith('/')) add(slug, 'hook', 'The Moltology hook must link to a page on the site')
    if (SENSITIVE_TOPICS.has(slug) && !page.disclaimer) add(slug, 'disclaimer', 'Health and money topics need a disclaimer line')

    const copy = pageCopy(page)
    const lower = copy.toLowerCase()
    for (const phrase of BANNED_PHRASES) {
      if (lower.includes(phrase)) add(slug, 'banned-phrase', `Copy uses "${phrase}"`)
    }
    for (const { pattern, why } of CLAIM_BANS) {
      const match = copy.match(pattern)
      if (match) add(slug, 'claim', `"${match[0]}": ${why}`)
    }
    const noOpeners = sentences(copy).filter((sentence) => /^(no|not)\b/.test(sentence)).length
    if (noOpeners > 3) add(slug, 'no-contrast', `${noOpeners} sentences open with "No"/"Not"; vary the shape`, 'warning')
    const wordCount = words(copy).length
    if (wordCount < LIMITS.wordsMin) add(slug, 'thin', `Only ${wordCount} words of page copy (want ${LIMITS.wordsMin}+)`)

    for (const sentence of new Set(sentences(copy))) {
      const owner = sentenceOwners.get(sentence)
      if (owner && owner !== slug) add(slug, 'duplicate-copy', `Shares a sentence with ${owner}: "${sentence.slice(0, 80)}"`)
      else sentenceOwners.set(sentence, slug)
    }

    if (options.imageExists) {
      const images = collectImages(page)
      for (const src of images) {
        if (!options.imageExists(src)) {
          add(slug, 'image-missing', `Missing image ${src}`, page.indexed ? 'error' : 'warning')
        }
      }
    }
  }

  for (const [shape, owners] of faqShapes) {
    if (owners.size >= 3) {
      for (const owner of owners) add(owner, 'faq-repeat', `FAQ opening "${shape}…" appears on ${owners.size} pages`)
    }
  }
  for (const owners of revealShapes.values()) {
    if (owners.length > 1) for (const owner of owners.slice(1)) add(owner, 'reveal-shape', `Reveal headline repeats a shape used by ${owners[0]}`)
  }

  return issues
}

/** Every image path a page uses. */
export function collectImages(page: BenefitPage): string[] {
  const found: string[] = []
  const walk = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(walk)
    else if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        if (key === 'src' && typeof item === 'string') found.push(item)
        else walk(item)
      }
    }
  }
  walk([page.content, page.shareImage])
  return found
}
