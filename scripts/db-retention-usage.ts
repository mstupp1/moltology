import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import {
  getTargetDatabaseUrl,
  parseCleanupArgs,
  type RetentionQuery,
} from './lib/db-retention-cleanup'
import {
  applyUsageRetention,
  countUsageRetentionCandidates,
} from './lib/db-retention-usage'

async function main() {
  const parsed = parseCleanupArgs(process.argv.slice(2), process.env.RETENTION_PROFILE)
  if (!parsed.ok) {
    console.error(`[retention] ${parsed.error}`)
    console.error('[retention] Usage: tsx scripts/db-retention-usage.ts --target=dev|prod [--apply] [--backup-reference=REF | --recovery=pitr] [--as-of=ISO_DATE]')
    process.exitCode = 2
    return
  }

  const { target, apply, profile, backupReference, recovery } = parsed.options
  const asOf = parsed.options.asOf ?? new Date()
  const databaseUrl = getTargetDatabaseUrl(target, process.env)
  if (!databaseUrl) {
    const key = target === 'dev' ? 'DEV_DATABASE_URL' : 'PROD_DATABASE_URL'
    throw new Error(`${key} is not configured; no database was contacted.`)
  }

  const query = neon(databaseUrl) as unknown as RetentionQuery
  console.log(`[retention:usage] target=${target} profile=${profile} mode=${apply ? 'apply' : 'dry-run'} asOf=${asOf.toISOString()}`)
  if (target === 'prod' && apply) {
    if (backupReference) {
      console.log(`[retention:usage] operator backup reference supplied: ${backupReference}`)
      console.log('[retention:usage] backup reference is recorded for operator context; this tool does not validate the backup.')
    }
    if (recovery === 'pitr') {
      console.log('[retention:usage] Recovery strategy: Neon PITR; restore window must be verified before enabling.')
    }
  }

  const candidates = await countUsageRetentionCandidates(query, asOf, profile)
  console.table(candidates)
  if (!apply) {
    console.log('[retention:usage] dry-run complete; no rows changed. Re-run with --apply to compact old raw events and expire old daily totals.')
    return
  }

  const result = await applyUsageRetention(query, asOf, profile, {
    onBatch: (progress) => {
      console.log(`[retention:usage] committed batch ${JSON.stringify({ asOf: asOf.toISOString(), ...progress })}`)
    },
  })
  console.table(result)
  if (result.capped) {
    console.error('[retention:usage] reached the per-phase batch cap; run another invocation with the same --as-of cutoff to continue.')
    process.exitCode = 1
    return
  }
  console.log('[retention:usage] bounded usage compaction complete.')
}

main().catch((error) => {
  console.error('[retention:usage] usage retention failed:', error)
  process.exitCode = 1
})

