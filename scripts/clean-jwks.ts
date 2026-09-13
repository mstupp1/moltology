import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { symmetricDecrypt } from 'better-auth/crypto'
import { getDb } from '../src/db'
import { authJwks } from '../src/db/schema'
import { DEV_AUTH_SECRET } from '../src/lib/auth-config'

function getActiveSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET
  if (secret && secret.length >= 16) return secret
  return DEV_AUTH_SECRET
}

export async function cleanJwks(options: { forceAll?: boolean } = {}) {
  const db = getDb()
  const rows = await db.select().from(authJwks)

  if (rows.length === 0) {
    console.log('[clean-jwks] JWKS table is already empty.')
    return { total: 0, pruned: 0 }
  }

  console.log(`[clean-jwks] Found ${rows.length} JWKS key(s) in database.`)

  if (options.forceAll) {
    console.log('[clean-jwks] --force specified: purging all JWKS keys.')
    for (const row of rows) {
      await db.delete(authJwks).where(eq(authJwks.id, row.id))
      console.log(`[clean-jwks] Deleted key: ${row.id}`)
    }
    return { total: rows.length, pruned: rows.length }
  }

  const secret = getActiveSecret()
  let pruned = 0

  for (const row of rows) {
    let isValid = false
    try {
      const parsed = JSON.parse(row.privateKey)
      await symmetricDecrypt({ key: secret, data: parsed })
      isValid = true
    } catch {
      isValid = false
    }

    if (!isValid) {
      console.warn(`[clean-jwks] Key ${row.id} cannot be decrypted with current secret. Pruning...`)
      await db.delete(authJwks).where(eq(authJwks.id, row.id))
      pruned++
      console.log(`[clean-jwks] ✓ Pruned invalid key: ${row.id}`)
    } else {
      console.log(`[clean-jwks] ✓ Key ${row.id} is valid with current secret.`)
    }
  }

  console.log(`[clean-jwks] Complete. Pruned ${pruned} invalid key(s) out of ${rows.length}.`)
  return { total: rows.length, pruned }
}

const isDirectRun = process.argv[1]?.includes('clean-jwks')
if (isDirectRun) {
  const forceAll = process.argv.includes('--force') || process.argv.includes('--all')
  cleanJwks({ forceAll })
    .then(() => {
      process.exit(0)
    })
    .catch((err) => {
      console.error('[clean-jwks] Fatal error:', err)
      process.exit(1)
    })
}
