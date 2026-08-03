import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config()

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set in environment.')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function main() {
  const target = process.argv[2]
  const role = process.argv[3] || 'super_admin'

  console.log(`[Grant Admin] Granting role '${role}'...`)

  if (!target) {
    // If no target provided, elevate all existing profiles to super_admin (or display instructions)
    const existing = await sql`SELECT id FROM profiles;`
    if (existing.length === 0) {
      console.log('No profiles found in database. Usage: npm run db:grant-admin <email_or_userId> [role]')
      return
    }

    console.log(`No specific target specified. Elevating ${existing.length} existing profile(s) to '${role}'...`)
    await sql`UPDATE profiles SET role = ${role};`
    console.log(`✓ All existing user profiles updated to role '${role}'!`)
    return
  }

  // 1. Try matching by profile ID directly
  let updated = await sql`UPDATE profiles SET role = ${role} WHERE id = ${target} RETURNING id;`

  // 2. If not matched by profile ID, check neon_auth.user table for email matching
  if (updated.length === 0) {
    try {
      const users = await sql`SELECT id FROM neon_auth.user WHERE email = ${target} OR id::text = ${target};`
      if (users.length > 0) {
        const userId = users[0].id
        updated = await sql`
          INSERT INTO profiles (id, role) VALUES (${userId}, ${role})
          ON CONFLICT (id) DO UPDATE SET role = ${role}
          RETURNING id;
        `
      }
    } catch (err) {
      console.warn('Checking neon_auth.user warning:', err)
    }
  }

  if (updated.length > 0) {
    console.log(`✓ User '${target}' successfully granted role '${role}'!`)
  } else {
    console.error(`❌ User '${target}' not found in profiles or neon_auth.user tables.`)
  }
}

main().catch((err) => {
  console.error('Grant admin error:', err)
  process.exit(1)
})
