#!/usr/bin/env node
/**
 * Benefit page check: content, SEO and duplicate-copy rules for src/lib/benefits/.
 * Run: npm run benefits:check   (--strict fails on missing images too; --no-images skips the bucket check)
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { BENEFIT_PAGES } from '../src/lib/benefits/summaries'
import type { BenefitPage } from '../src/lib/benefits/types'
import { S3_BASE_URL } from '../src/lib/assets'
import { checkBenefitPages, collectImages } from './lib/benefit-pages-check'

const PAGES_DIR = 'src/lib/benefits/pages'
const strict = process.argv.includes('--strict')

async function loadPages(): Promise<BenefitPage[]> {
  const files = fs.readdirSync(PAGES_DIR).filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
  const pages: BenefitPage[] = []
  for (const file of files) {
    const mod = (await import(pathToFileURL(path.resolve(PAGES_DIR, file)).href)) as { default: BenefitPage }
    pages.push(mod.default)
  }
  return pages
}

/** Images live in the asset bucket (docs/assets-and-media.md); ask it which keys exist. */
async function findImages(pages: BenefitPage[]): Promise<Set<string>> {
  const found = new Set<string>()
  const keys = [...new Set(pages.flatMap(collectImages))]
  await Promise.all(
    keys.map(async (src) => {
      try {
        const response = await fetch(`${S3_BASE_URL}/${src.replace(/^\/+/, '').split('?')[0]}`, { method: 'HEAD' })
        if (response.ok) found.add(src)
      } catch {
        // Offline: reported as missing below.
      }
    }),
  )
  return found
}

const pages = await loadPages()
const skipImages = process.argv.includes('--no-images')
const images = skipImages ? null : await findImages(pages)
const issues = checkBenefitPages(BENEFIT_PAGES, pages, images ? { imageExists: (src) => images.has(src) } : {})

for (const issue of issues) {
  const log = issue.level === 'error' ? console.error : console.warn
  log(`  ${issue.level === 'error' ? '✗' : '!'} ${issue.slug}: [${issue.rule}] ${issue.message}`)
}
const failing = issues.filter((issue) => issue.level === 'error' || strict)
if (failing.length) {
  console.error(`[benefits:check] ${failing.length} problem(s) across ${pages.length} pages.`)
  process.exit(1)
}
console.log(`[benefits:check] OK: ${pages.length} pages${issues.length ? `, ${issues.length} warning(s)` : ''}.`)
