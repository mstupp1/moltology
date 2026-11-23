#!/usr/bin/env node
/**
 * Content brief from a benefit landing page, for content skills that wear its costume.
 *
 *   npm run costumes:brief -- --list               every benefit page, grouped by costume
 *   npm run costumes:brief -- --topic libido       one page: angle, hook, copy, safety lines, look
 *   npm run costumes:brief -- --kit can            one costume: its pages and design tokens
 *
 * What each costume borrows from its industry, and the rules for wearing one: content/costumes.md.
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { COSTUMES } from '../src/lib/benefits/costumes'
import { BENEFIT_KITS, BENEFIT_PAGES } from '../src/lib/benefits/summaries'
import type { BenefitKit, BenefitPage } from '../src/lib/benefits/types'

const SITE = 'https://moltology.org'
const args = process.argv.slice(2)
const arg = (flag: string) => {
  const i = args.indexOf(flag)
  return i === -1 ? undefined : args[i + 1]
}

function starterLayout(kit: BenefitKit): string | undefined {
  const dir = 'content/composite-layouts'
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(`costume-${kit}-`))
    .map((f) => path.join(dir, f))[0]
}

function lookLines(kit: BenefitKit): string[] {
  const c = COSTUMES[kit]
  const colors = Object.entries(c.colors)
    .map(([name, value]) => `${name} ${value}`)
    .join(', ')
  const fonts = (['display', 'body', 'serif', 'mono', 'script'] as const).map((r) => `${r}: ${c.fonts[r].split(',')[0]}`).join('; ')
  const l = c.lockup
  const lockup = [l.prefix, l.word, l.suffix].filter(Boolean).join(' ') + (l.sub ? ` / ${l.sub}` : '')
  return [
    `- Costume: ${kit} (${BENEFIT_KITS[kit].industry}), ${c.tone} ground`,
    `- Colors: ${colors}`,
    `- Fonts: ${fonts}`,
    `- Headlines: weight ${c.headline.weight}${c.headline.uppercase ? ', all caps' : ''}${c.headline.italic ? ', italic' : ''}`,
    `- Lockup: "${lockup}" (${l.icon === 'none' ? 'no emblem' : `emblem ${l.icon}`})`,
    `- Starter layout: ${starterLayout(kit) ?? 'none yet'} ("costume": "${kit}" in any layout spec)`,
  ]
}

async function loadPage(slug: string): Promise<BenefitPage | null> {
  const file = path.resolve('src/lib/benefits/pages', `${slug}.ts`)
  if (!fs.existsSync(file)) return null
  return ((await import(pathToFileURL(file).href)) as { default: BenefitPage }).default
}

/** The page's first-screen copy, whatever its kit calls the parts. */
function heroLines(page: BenefitPage): string[] {
  const hero = (page.content as { hero?: Record<string, unknown> }).hero ?? {}
  const pick = (key: string) => (typeof hero[key] === 'string' ? (hero[key] as string) : undefined)
  const label = pick('eyebrow') ?? pick('sticker') ?? pick('kicker') ?? pick('season') ?? pick('tag') ?? pick('badge')
  return [label && `- Label: ${label}`, pick('headline') && `- Headline: ${pick('headline')}`, pick('sub') && `- Sub: ${pick('sub')}`, pick('cta') && `- Button: ${pick('cta')}`].filter(
    (line): line is string => Boolean(line)
  )
}

async function topicBrief(slug: string) {
  const page = await loadPage(slug)
  if (!page) {
    console.error(`No benefit page "${slug}". Run with --list to see them.`)
    process.exit(1)
  }
  const hero = (page.content as { hero?: { image?: { src: string } } }).hero
  const out = [
    `# ${page.topic} (${page.kit} costume)`,
    '',
    `- Page: ${SITE}/benefits/${page.slug}${page.indexed ? '' : ' (noindex until approved: link it only once it is live and indexed, or link the real feature instead)'}`,
    `- Search phrase: ${page.query}`,
    `- Real hook: ${page.hook.label} (${SITE}${page.hook.href}). ${page.hook.text}`,
    page.disclaimer ? `- Safety line (use it whenever the piece touches this topic): ${page.disclaimer}` : '- Safety line: none needed',
    '',
    '## First screen copy',
    ...heroLines(page),
    '',
    '## The reveal',
    `- ${page.reveal.headline}`,
    `- ${page.reveal.body}`,
    `- Real screen to show: ${page.reveal.screenshot}`,
    '',
    '## Questions people ask (good hooks)',
    ...page.faqs.map((f) => `- ${f.question}`),
    '',
    '## Look',
    ...lookLines(page.kit),
    hero?.image?.src ? `- Page art: ${hero.image.src}${page.shareImage ? `, share card ${page.shareImage.src}` : ''}` : '',
    page.related.length ? `- Related pages: ${page.related.join(', ')}` : '',
  ].filter((line, i, all) => line !== '' || all[i - 1] !== '')
  console.log(out.join('\n'))
}

function list(kits: BenefitKit[]) {
  for (const kit of kits) {
    const pages = BENEFIT_PAGES.filter((p) => p.kit === kit)
    console.log(`\n${BENEFIT_KITS[kit].name} (${kit}): ${BENEFIT_KITS[kit].industry}`)
    for (const p of pages) console.log(`  ${p.slug.padEnd(18)} ${p.indexed ? 'live ' : 'draft'}  ${p.blurb}`)
  }
}

async function main() {
  const topic = arg('--topic')
  const kit = arg('--kit') as BenefitKit | undefined
  if (topic) return topicBrief(topic)
  if (kit) {
    if (!(kit in COSTUMES)) {
      console.error(`No costume "${kit}". Costumes: ${Object.keys(COSTUMES).join(', ')}`)
      process.exit(1)
    }
    console.log(lookLines(kit).join('\n'))
    return list([kit])
  }
  if (args.includes('--list')) return list(Object.keys(BENEFIT_KITS) as BenefitKit[])
  console.log('Usage: npm run costumes:brief -- --list | --topic <slug> | --kit <costume>')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
