#!/usr/bin/env node
/**
 * Vercel Deployment Cleaner
 *
 * Prunes stale preview deployments (and optionally old production deployments)
 * to reclaim Vercel Deployment Storage (Hobby plan 10 GB limit).
 *
 * Usage:
 *   node scripts/clean-vercel-deployments.mjs               # Dry-run, previews > 2 days old
 *   node scripts/clean-vercel-deployments.mjs --days=3       # Dry-run, previews > 3 days old
 *   node scripts/clean-vercel-deployments.mjs --execute      # Perform live deletions
 *   node scripts/clean-vercel-deployments.mjs --execute --days=1
 *   node scripts/clean-vercel-deployments.mjs --execute --prod-days=14 # Also prune prod > 14d (keeping 5 newest)
 */

import { execSync } from 'node:child_process'
import process from 'node:process'

function parseArgs() {
  const args = process.argv.slice(2)
  const execute = args.includes('--execute') || args.includes('--yes') || args.includes('-y')

  const daysArg = args.find((a) => a.startsWith('--days='))
  const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 2

  const projectArg = args.find((a) => a.startsWith('--project='))
  const project = projectArg ? projectArg.split('=')[1] : 'moltology'

  const prodDaysArg = args.find((a) => a.startsWith('--prod-days='))
  const deleteProdOlderThanDays = prodDaysArg ? parseInt(prodDaysArg.split('=')[1], 10) : undefined

  return {
    dryRun: !execute,
    days: isNaN(days) ? 2 : days,
    keepProd: 5,
    project,
    deleteProdOlderThanDays,
  }
}

function fetchDeployments(project) {
  process.stdout.write(`Fetching deployments for project "${project}"... `)
  let until = ''
  const deployments = []

  for (let page = 0; page < 25; page++) {
    const url = until
      ? `/v6/deployments?limit=100&until=${until}`
      : `/v6/deployments?limit=100`

    try {
      const raw = execSync(`CI=1 vercel api "${url}"`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })

      const data = JSON.parse(raw)
      const list = data.deployments || []
      if (list.length === 0) break

      for (const d of list) {
        if (d.name === project) {
          deployments.push(d)
        }
      }

      if (!data.pagination?.next) break
      until = data.pagination.next
    } catch (err) {
      console.error('\nError fetching deployments:', err.message)
      break
    }
  }

  console.log(`found ${deployments.length}.`)
  return deployments
}

function deleteDeployment(id) {
  try {
    execSync(`CI=1 vercel api /v13/deployments/${id} -X DELETE --dangerously-skip-permissions`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return true
  } catch {
    return false
  }
}

async function main() {
  const opts = parseArgs()

  console.log('=== Vercel Deployment Storage Cleaner ===')
  console.log(`Target project: ${opts.project}`)
  console.log(`Mode:           ${opts.dryRun ? '🔍 DRY RUN (safe mode)' : '🚨 LIVE EXECUTION (deleting deployments)'}`)
  console.log(`Preview cutoff: > ${opts.days} day(s) old`)
  if (opts.deleteProdOlderThanDays !== undefined) {
    console.log(`Prod cutoff:    > ${opts.deleteProdOlderThanDays} day(s) old (keeping newest ${opts.keepProd})`)
  }
  console.log('')

  const deployments = fetchDeployments(opts.project)
  if (deployments.length === 0) {
    console.log('No deployments found.')
    return
  }

  const now = Date.now()
  const cutoffMs = opts.days * 24 * 60 * 60 * 1000

  const toDeletePreviews = []
  const prodDeployments = []

  for (const d of deployments) {
    const isProd = d.target === 'production'
    if (isProd) {
      prodDeployments.push(d)
    } else {
      const ageMs = now - (d.createdAt || d.created)
      if (ageMs > cutoffMs) {
        toDeletePreviews.push(d)
      }
    }
  }

  prodDeployments.sort((a, b) => (b.createdAt || b.created) - (a.createdAt || a.created))

  const toDeleteProd = []
  if (opts.deleteProdOlderThanDays !== undefined) {
    const prodCutoffMs = opts.deleteProdOlderThanDays * 24 * 60 * 60 * 1000
    const eligibleProd = prodDeployments.slice(opts.keepProd)
    for (const d of eligibleProd) {
      const ageMs = now - (d.createdAt || d.created)
      if (ageMs > prodCutoffMs) {
        toDeleteProd.push(d)
      }
    }
  }

  console.log(`\nDeployment breakdown for "${opts.project}":`)
  console.log(`  - Total deployments:            ${deployments.length}`)
  console.log(`  - Production deployments:       ${prodDeployments.length}`)
  console.log(`  - Preview deployments:          ${deployments.length - prodDeployments.length}`)
  console.log(`  - Preview to delete (> ${opts.days}d):   ${toDeletePreviews.length}`)
  if (opts.deleteProdOlderThanDays !== undefined) {
    console.log(`  - Prod to delete (> ${opts.deleteProdOlderThanDays}d):      ${toDeleteProd.length}`)
  }
  console.log(`  - Retained production releases: ${prodDeployments.length - toDeleteProd.length}`)

  const totalToDelete = toDeletePreviews.length + toDeleteProd.length

  if (totalToDelete === 0) {
    console.log('\n✅ No deployments match the deletion criteria.')
    return
  }

  // Estimate ~38 MB average per deployment (TanStack Start bundle + static public assets)
  const estimatedMB = totalToDelete * 38
  const estimatedGB = (estimatedMB / 1024).toFixed(2)

  if (opts.dryRun) {
    console.log(`\nSample preview deployments queued for deletion:`)
    for (const d of toDeletePreviews.slice(0, 6)) {
      const ageDays = ((now - (d.createdAt || d.created)) / (24 * 3600 * 1000)).toFixed(1)
      const ref = d.meta?.githubCommitRef || 'unknown'
      console.log(`  • [${d.uid}] ${d.url}`)
      console.log(`    Branch: ${ref} | Age: ${ageDays} days`)
    }
    if (toDeletePreviews.length > 6) {
      console.log(`    ... and ${toDeletePreviews.length - 6} more preview deployments`)
    }

    console.log(`\nEstimated storage freed: ~${estimatedMB} MB (~${estimatedGB} GB)`)
    console.log(`\nTo execute deletion, run:`)
    console.log(`  node scripts/clean-vercel-deployments.mjs --execute --days=${opts.days}`)
    return
  }

  console.log(`\nDeleting ${totalToDelete} deployments...`)
  let deletedCount = 0

  const allToDelete = [...toDeletePreviews, ...toDeleteProd]
  for (const d of allToDelete) {
    const ok = deleteDeployment(d.uid)
    if (ok) {
      deletedCount++
      if (deletedCount % 10 === 0 || deletedCount === totalToDelete) {
        console.log(`  Progress: ${deletedCount}/${totalToDelete} deleted...`)
      }
    }
  }

  console.log(`\n✅ Finished! Successfully deleted ${deletedCount} deployments.`)
  console.log(`Estimated storage reclaimed: ~${((deletedCount * 38) / 1024).toFixed(2)} GB`)
}

main().catch((err) => {
  console.error('Cleaner script failed:', err)
  process.exit(1)
})
