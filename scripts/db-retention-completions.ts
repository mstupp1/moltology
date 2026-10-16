import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import {
  applyCompletionRetention,
  countCompletionRetentionCandidates,
  type CompletionRetentionQuery,
} from './lib/db-retention-completions'
import { getTargetDatabaseUrl, parseCleanupArgs } from './lib/db-retention-cleanup'

async function main() {
  const parsed = parseCleanupArgs(process.argv.slice(2), process.env.RETENTION_PROFILE)
  if (!parsed.ok) {
    console.error(`[retention] ${parsed.error}`)
    console.error('[retention] Usage: tsx scripts/db-retention-completions.ts --target=dev|prod [--apply] [--backup-reference=REF | --recovery=pitr] [--as-of=ISO_DATE]')
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

  const query = neon(databaseUrl) as unknown as CompletionRetentionQuery
  console.log(`[retention] target=${target} profile=${profile} mode=${apply ? 'apply' : 'dry-run'} asOf=${asOf.toISOString()}`)
  if (target === 'prod' && apply) {
    if (backupReference) {
      console.log(`[retention] operator backup reference supplied: ${backupReference}`)
      console.log('[retention] backup reference is recorded for operator context; this tool does not validate the backup.')
    }
    if (recovery === 'pitr') {
      console.log('[retention] Recovery strategy: Neon PITR; restore window must be verified before enabling.')
    }
  }
  const candidates = await countCompletionRetentionCandidates(query, asOf, profile)
  console.table(candidates)
  if (!apply) {
    console.log('[retention] dry-run complete; no rows changed. Re-run with --apply to execute bounded batches.')
    return
  }

  const result = await applyCompletionRetention(query, asOf, profile, {
    onBatch: (progress) => {
      console.log(`[retention:completions] committed batch ${JSON.stringify({ asOf: asOf.toISOString(), ...progress })}`)
    },
  })
  console.table(result)
  if (result.capped) {
    console.error('[retention] reached the per-table batch cap; rerun with the same --as-of value to continue.')
    process.exitCode = 1
    return
  }
  console.log('[retention] completion compaction complete.')
}

main().catch((error) => {
  console.error('[retention] completion compaction failed:', error)
  process.exitCode = 1
})
