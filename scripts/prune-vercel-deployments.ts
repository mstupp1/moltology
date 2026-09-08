import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

interface Deployment {
  uid: string
  name: string
  url: string
  createdAt: number
  state: string
  target: string | null
}

interface Alias {
  alias: string
  deploymentId: string
}

function resolveVercelToken(): string {
  if (process.env.VERCEL_TOKEN) {
    return process.env.VERCEL_TOKEN
  }

  const possiblePaths = [
    path.join(os.homedir(), 'Library/Application Support/com.vercel.cli/auth.json'),
    path.join(os.homedir(), '.local/share/com.vercel.cli/auth.json'),
    path.join(os.homedir(), '.vercel/auth.json'),
  ]

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'))
        if (data.token) return data.token
      } catch {
        // continue
      }
    }
  }

  throw new Error('Could not find Vercel authentication token. Run `vercel login` or set VERCEL_TOKEN.')
}

function parseArgs() {
  const args = process.argv.slice(2)
  const isApply = args.includes('--apply')
  const isDryRun = !isApply || args.includes('--dry-run')

  let keepDays = 3
  const keepDaysIdx = args.indexOf('--keep-days')
  if (keepDaysIdx !== -1 && args[keepDaysIdx + 1]) {
    keepDays = Number.parseInt(args[keepDaysIdx + 1], 10)
  }

  return { isApply: !isDryRun, isDryRun, keepDays }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const { isApply, isDryRun, keepDays } = parseArgs()
  const token = resolveVercelToken()

  const projectConfigPath = path.join(process.cwd(), '.vercel/project.json')
  let projectId = 'prj_JgsDBU10CmdDlcA3zAC8RT0RhB7I'
  let teamId = 'team_qDUUJ2NORjiaoCyR7I1CDLnL'

  if (fs.existsSync(projectConfigPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'))
      if (cfg.projectId) projectId = cfg.projectId
      if (cfg.orgId) teamId = cfg.orgId
    } catch {
      // use defaults
    }
  }

  console.log(`[vercel-prune] Scanning deployments for project ${projectId} (Team ${teamId})...`)
  console.log(`[vercel-prune] Mode: ${isApply ? 'APPLY (deleting matching deployments)' : 'DRY-RUN (no deletions)'}`)
  console.log(`[vercel-prune] Retention window: keeping deployments from the last ${keepDays} days.`)

  // 1. Fetch active aliases
  const aliasesRes = await fetch(`https://api.vercel.com/v4/aliases?teamId=${teamId}&projectId=${projectId}&limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!aliasesRes.ok) {
    throw new Error(`Failed to fetch aliases: ${aliasesRes.status} ${await aliasesRes.text()}`)
  }
  const aliasesData = (await aliasesRes.json()) as { aliases?: Alias[] }
  const protectedDomains = [
    'moltology.org',
    'www.moltology.org',
    'moltology.vercel.app',
    'moltology-myles-projects-886f221f.vercel.app',
    'moltology-git-main-myles-projects-886f221f.vercel.app',
  ]

  const activeProductionDeploymentIds = new Set<string>()
  for (const a of aliasesData.aliases || []) {
    if (protectedDomains.includes(a.alias)) {
      activeProductionDeploymentIds.add(a.deploymentId)
    }
  }

  console.log(`[vercel-prune] Found ${activeProductionDeploymentIds.size} active production aliased deployments.`)

  // 2. Fetch all deployments
  let until: number | undefined = undefined
  const allDeployments: Deployment[] = []

  while (true) {
    let url = `https://api.vercel.com/v6/deployments?teamId=${teamId}&projectId=${projectId}&limit=100`
    if (until) url += `&until=${until}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      throw new Error(`Failed to list deployments: ${res.status} ${await res.text()}`)
    }
    const data = (await res.json()) as { deployments?: Deployment[]; pagination?: { next?: number } }
    if (!data.deployments || data.deployments.length === 0) break
    allDeployments.push(...data.deployments)
    if (!data.pagination?.next) break
    until = data.pagination.next
  }

  // Sort newest first
  allDeployments.sort((a, b) => b.createdAt - a.createdAt)
  console.log(`[vercel-prune] Retrieved ${allDeployments.length} total deployments.`)

  // 3. Mark protected deployments:
  // - Current active production custom domains
  // - Top 10 most recent production builds
  // - Anything created within keepDays
  const keepProdIds = new Set<string>()
  let prodCount = 0
  for (const d of allDeployments) {
    if (d.target === 'production') {
      keepProdIds.add(d.uid)
      prodCount++
      if (prodCount >= 10) break
    }
  }

  const cutoffMs = Date.now() - keepDays * 24 * 60 * 60 * 1000
  const pruneCutoffMs = new Date('2026-08-28T21:39:25Z').getTime() // point where prune-vercel-function script landed

  const toKeep: Deployment[] = []
  const toDelete: Deployment[] = []

  for (const d of allDeployments) {
    const isProtectedAlias = activeProductionDeploymentIds.has(d.uid)
    const isTopProd = keepProdIds.has(d.uid)
    const isRecent = d.createdAt >= cutoffMs

    if (isProtectedAlias || isTopProd || isRecent) {
      toKeep.push(d)
    } else {
      toDelete.push(d)
    }
  }

  let funcStorageFreedMb = 0
  let staticStorageFreedMb = 0
  for (const d of toDelete) {
    funcStorageFreedMb += d.createdAt < pruneCutoffMs ? 72.4 : 3.0
    staticStorageFreedMb += 28.0
  }

  console.log('\n--- Prune Plan Summary ---')
  console.log(`Retained Deployments: ${toKeep.length}`)
  console.log(`  - Active custom domain aliases: ${activeProductionDeploymentIds.size}`)
  console.log(`  - Latest production deployments: ${keepProdIds.size}`)
  console.log(`  - Deployments within last ${keepDays} days: ${toKeep.filter((d) => d.createdAt >= cutoffMs).length}`)
  console.log(`Deployments to Prune: ${toDelete.length}`)
  console.log(`  - Estimated Function Storage recovered: ${(funcStorageFreedMb / 1024).toFixed(2)} GB`)
  console.log(`  - Estimated Deployment Storage recovered: ${(staticStorageFreedMb / 1024).toFixed(2)} GB`)
  console.log('---------------------------\n')

  if (isDryRun) {
    console.log('[vercel-prune] Dry run completed. To execute deletion, run with `--apply`:')
    console.log(`  tsx scripts/prune-vercel-deployments.ts --apply --keep-days ${keepDays}`)
    return
  }

  // Execute deletion
  console.log(`[vercel-prune] Deleting ${toDelete.length} deployments...`)
  let deletedCount = 0
  let failedCount = 0

  for (let i = 0; i < toDelete.length; i++) {
    const dep = toDelete[i]
    let retries = 3
    let success = false

    while (retries > 0) {
      try {
        const delRes = await fetch(`https://api.vercel.com/v13/deployments/${dep.uid}?teamId=${teamId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (delRes.status === 200) {
          deletedCount++
          success = true
          break
        } else if (delRes.status === 429) {
          // Rate limit encountered, wait 2 seconds
          console.warn(`[vercel-prune] Rate limited (429). Backing off for 2s...`)
          await sleep(2000)
          retries--
        } else if (delRes.status === 404) {
          // Already deleted
          deletedCount++
          success = true
          break
        } else {
          const errText = await delRes.text()
          console.error(`[vercel-prune] Failed to delete ${dep.uid} (${dep.url}): ${delRes.status} ${errText}`)
          retries--
          await sleep(500)
        }
      } catch (err) {
        console.error(`[vercel-prune] Network error deleting ${dep.uid}:`, err)
        retries--
        await sleep(1000)
      }
    }

    if (!success) {
      failedCount++
    }

    if ((i + 1) % 25 === 0 || i === toDelete.length - 1) {
      console.log(`[vercel-prune] Progress: ${i + 1}/${toDelete.length} processed (${deletedCount} deleted, ${failedCount} errors)`)
    }

    // Gentle throttle to respect Vercel API limits (~10 req/sec)
    await sleep(80)
  }

  console.log('\n=======================================')
  console.log(`[vercel-prune] Cleanup Finished!`)
  console.log(`Successfully deleted: ${deletedCount} deployments.`)
  if (failedCount > 0) {
    console.log(`Failed: ${failedCount} deployments.`)
  }
  console.log(`Estimated reclaimed Function Storage: ${(funcStorageFreedMb / 1024).toFixed(2)} GB`)
  console.log(`Estimated reclaimed Deployment Storage: ${(staticStorageFreedMb / 1024).toFixed(2)} GB`)
  console.log('=======================================\n')
}

main().catch((err) => {
  console.error('[vercel-prune] Execution error:', err)
  process.exit(1)
})
