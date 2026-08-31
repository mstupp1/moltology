#!/usr/bin/env node
/**
 * Asset Budget Guard
 *
 * Keeps the repository and deploy artifact lightweight per AGENTS.md policy:
 * - No tracked file may exceed MAX_FILE_MB unless allowlisted.
 * - public/ may only contain essential local assets (favicon, hero videos,
 *   whitelisted image dirs); all content media belongs on Neon S3.
 * - public/images files must stay under IMAGE_BUDGET_KB (recompress instead).
 *
 * Run: npm run assets:check
 */
import { execSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const MAX_FILE_MB = 1
const IMAGE_BUDGET_KB = 600

const ALLOWLIST_PREFIXES = [
  'public/videos/',
  'assets/audio/',
  // Video/social pipeline render sources: never deployed, kept local for
  // compositing fidelity. Do not grow this list with deployable assets.
  'content/social/assets/',
  'package-lock.json',
]

const PUBLIC_IMAGE_ALLOW_PREFIXES = [
  'public/images/chassis/',
  'public/images/forum/',
  'public/images/marketing/',
]

const PUBLIC_ALLOWED_ROOT_FILES = new Set([
  'public/favicon.ico',
  'public/favicon.png',
  'public/robots.txt',
  'public/llms.txt',
  'public/llms-full.txt',
  'public/manifest.webmanifest',
  'public/sw.js',
  'public/offline.html',
])

function listTrackedFiles(): string[] {
  return execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
}

function isAllowed(relPath: string): boolean {
  return ALLOWLIST_PREFIXES.some((prefix) => relPath.startsWith(prefix))
}

function isEssentialPublicAsset(relPath: string): boolean {
  if (PUBLIC_ALLOWED_ROOT_FILES.has(relPath)) return true
  if (relPath.startsWith('public/videos/')) return true
  if (relPath.startsWith('public/fonts/')) return true
  if (relPath.startsWith('public/images/')) {
    return (
      PUBLIC_IMAGE_ALLOW_PREFIXES.some((prefix) => relPath.startsWith(prefix)) ||
      relPath === 'public/images/order_emblem.png' ||
      relPath === 'public/images/order_emblem.webp' ||
      relPath === 'public/images/scanline_pattern.png' ||
      relPath.startsWith('public/images/bubble_variant_') ||
      relPath.startsWith('public/images/pwa/')
    )
  }
  return false
}

async function main() {
  const files = listTrackedFiles()
  const errors: string[] = []
  const warnings: string[] = []

  for (const relPath of files) {
    if (isAllowed(relPath)) continue

    const stat = await import('node:fs/promises').then((fs) => fs.stat(relPath).catch(() => null))
    if (!stat) {
      warnings.push(
        `STAGED CHANGE: ${relPath} is in the git index but missing on disk. Stage the deletion with git add -A.`
      )
      continue
    }
    if (!stat.isFile()) continue
    const sizeKB = stat.size / 1024

    if (sizeKB > MAX_FILE_MB * 1024) {
      errors.push(
        `OVER LIMIT: ${relPath} is ${sizeKB.toFixed(0)}KB (max ${MAX_FILE_MB}MB). ` +
          `Move content media to Neon S3 (see scripts/sync-s3-assets.ts) or add to the allowlist in scripts/check-asset-budget.ts.`
      )
    }

    if (relPath.startsWith('public/') && !isEssentialPublicAsset(relPath)) {
      errors.push(
        `NOT ESSENTIAL: ${relPath} lives in public/ but is not on the local-asset allowlist. ` +
          `Content media must be served from Neon S3 via getAssetUrl() — upload it, reference it by S3 key, then git rm the local copy.`
      )
    }

    if (relPath.startsWith('public/images/') && sizeKB > IMAGE_BUDGET_KB) {
      warnings.push(
        `HEAVY IMAGE: ${relPath} is ${sizeKB.toFixed(0)}KB (budget ${IMAGE_BUDGET_KB}KB). ` +
          `Recompress (e.g. sips -s formatOptions 78) before committing.`
      )
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠ Asset budget warnings:')
    for (const w of warnings) console.warn(`  ${w}`)
  }

  if (errors.length > 0) {
    console.error('✗ Asset budget violations:')
    for (const e of errors) console.error(`  ${e}`)
    process.exit(1)
  }

  console.log(`✓ Asset budget OK (${files.length} tracked files)`)
}

main().catch((err) => {
  console.error('Asset budget check failed:', err)
  process.exit(1)
})
