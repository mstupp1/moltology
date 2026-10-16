import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import {
  getTargetDatabaseHost,
  getTargetDatabaseUrl,
  parseCleanupArgs,
  type RetentionQuery,
} from './lib/db-retention-cleanup'
import {
  applyChatRetention,
  countChatRetentionCandidates,
} from './lib/db-retention-chats'

async function main() {
  const parsed = parseCleanupArgs(process.argv.slice(2), process.env.RETENTION_PROFILE)
  if (!parsed.ok) {
    console.error(`[retention:chats] ${parsed.error}`)
    console.error('[retention:chats] Usage: tsx scripts/db-retention-chats.ts --target=dev|prod [--apply] [--backup-reference=REF | --recovery=pitr] [--as-of=ISO_DATE]')
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
  console.log(`[retention:chats] target=${target} host=${getTargetDatabaseHost(databaseUrl)} mode=${apply ? 'apply' : 'dry-run'} asOf=${asOf.toISOString()}`)
  if (target === 'prod' && apply) {
    if (backupReference) {
      console.log(`[retention:chats] operator backup reference supplied: ${backupReference}`)
      console.log('[retention:chats] backup reference is recorded for operator context; this tool does not validate the backup.')
    }
    if (recovery === 'pitr') {
      console.log('[retention:chats] Recovery strategy: Neon PITR; restore window must be verified before enabling.')
    }
  }

  const candidates = await countChatRetentionCandidates(query, asOf)
  console.log(`[retention:chats] archived threads eligible for deletion=${candidates}; active threads, including pinned ones, are retained.`)
  if (!apply) {
    console.log('[retention:chats] dry-run complete; no threads or messages deleted. Re-run with --apply to delete expired archived threads.')
    return
  }

  const result = await applyChatRetention(query, asOf, {
    onBatch: (progress) => console.log(`[retention:chats] batch ${progress.batch} ${JSON.stringify(progress.counts)}`),
  })
  console.table(result)
  if (result.capped) {
    console.error('[retention:chats] reached the batch cap; run another invocation with the same --as-of cutoff to continue.')
    process.exitCode = 1
    return
  }
  console.log('[retention:chats] bounded chat retention complete; thread deletion also removes its messages by foreign-key cascade.')
}

main().catch((error) => {
  console.error('[retention:chats] chat retention failed:', error)
  process.exitCode = 1
})

