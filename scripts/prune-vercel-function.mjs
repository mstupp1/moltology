#!/usr/bin/env node
/**
 * Post-build prune for Vercel deploys.
 *
 * Nitro's vercel preset copies public/ assets into the serverless function
 * bundle, but Vercel's edge serves them from the static output — the copies
 * inside the function are dead weight (~80MB per deploy). This script removes
 * the duplicated asset dirs from the function bundle after `vite build`.
 *
 * No-op for non-Vercel (node-server) builds where .vercel/output is absent.
 * MUST run after `vite build` (not as a nitro `compiled` hook — registering
 * that hook replaces the vercel preset's own compiled hook, which writes
 * .vercel/output/config.json and .vc-config.json; losing those breaks deploys).
 */
import { rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const SERVER_ONLY_PUBLIC_DIRS = ['audio', 'videos', 'images', 'downloads']
const OUTPUT_DIR = '.vercel/output'
const FUNCTION_DIR = `${OUTPUT_DIR}/functions/__fallback.func`
const STATIC_DIR = `${OUTPUT_DIR}/static`

async function main() {
  if (!existsSync(path.join(OUTPUT_DIR, 'config.json'))) {
    return
  }

  const pruned = []
  await Promise.all(
    SERVER_ONLY_PUBLIC_DIRS.map(async (dir) => {
      const dupe = path.join(FUNCTION_DIR, dir)
      if (existsSync(path.join(STATIC_DIR, dir)) && existsSync(dupe)) {
        await rm(dupe, { recursive: true, force: true })
        pruned.push(dir)
      }
    })
  )

  if (pruned.length > 0) {
    console.log(`[prune-vercel-function] Removed duplicated static assets from function bundle: ${pruned.join(', ')}/`)
  }
}

main().catch((err) => {
  console.error('[prune-vercel-function] failed:', err)
  process.exit(1)
})
