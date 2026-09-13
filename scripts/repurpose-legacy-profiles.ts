import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { normalizeFriendPair } from '../src/lib/connections'

interface ScriptOptions {
  dryRun: boolean
  databaseUrl: string
}

const MSTUPP_OLD_ID = 'a0565b51-2fdc-412f-88c0-bb783e721efb'
const MRKRABS_NEW_ID = 'NUBirqu1KNSnM41jXnQt3SMGobGHuoCJ'

const EMPTY_PROFILES_TO_PURGE = [
  '27b62c18-5839-4466-bb96-c078e6a87215',
  'b0b765f0-1aaf-43f5-aa3e-d96a75d6bdcf',
  '233cda4f-0db3-45cf-bdfe-f6997f3757ef',
]

const PROFILES_TO_SIMULATE = [
  {
    id: 'c111f0f5-6cb6-4ee5-8247-32b71dc4445d',
    handle: 'moltboy',
    larvaId: 'LARVA UNIT #4004',
    stage: 1,
    joinSource: 'organic' as const,
    persona: {
      archetype: 'Ecdysis Enthusiast',
      tone: 'Curious, supportive, enthusiastic initiate navigating early shell shedding.',
      bio: 'Testing shell boundaries and daily habit liturgies under steady benthic pressure.',
      activityCadence: 'normal' as const,
      lastSimulatedAt: new Date().toISOString(),
      traits: [
        {
          id: 'eager_shedder',
          label: 'Eager shedder',
          description: 'Always ready to cast off the old carapace for a fresh cycle.',
        },
      ],
    },
    avatarConfig: {
      style: 'bottts',
      seed: 'moltboy-avatar-seed-4004',
    },
    postAuthorName: null,
  },
  {
    id: '753a434e-b4c6-4681-9f6c-db3e5e5ca284',
    handle: 'TrenchSeeker_79',
    larvaId: 'LARVA UNIT #7928',
    stage: 1,
    joinSource: 'word_of_mouth' as const,
    persona: {
      archetype: 'Deep-Trench Novice',
      tone: 'Persistent, habit-focused, earnest explorer of canonical liturgies.',
      bio: 'Focusing on consecutive daily alignment liturgies and carapace hardening routines.',
      activityCadence: 'normal' as const,
      lastSimulatedAt: new Date().toISOString(),
      traits: [
        {
          id: 'habit_anchor',
          label: 'Habit anchor',
          description: 'Never leaves an alignment liturgy half-done.',
        },
      ],
    },
    avatarConfig: {
      style: 'shapes',
      seed: 'trench-seeker-seed-7928',
    },
    postAuthorName: 'TrenchSeeker_79',
  },
  {
    id: '258049c8-ce32-41b4-8cc4-a1111da7fc54',
    handle: 'CarapacePilot_35',
    larvaId: 'LARVA UNIT #3511',
    stage: 1,
    joinSource: 'brought_in' as const,
    persona: {
      archetype: 'Carapace Vanguard',
      tone: 'Methodical, practical, pincer-torque focused biomechanical operator.',
      bio: 'Mastering the early morning alignment lock and pressure resilience benchmarks.',
      activityCadence: 'normal' as const,
      lastSimulatedAt: new Date().toISOString(),
      traits: [
        {
          id: 'torque_tuner',
          label: 'Torque tuner',
          description: 'Calibrates pincer mechanics with mathematical rigor.',
        },
      ],
    },
    avatarConfig: {
      style: 'identicon',
      seed: 'carapace-pilot-seed-3511',
    },
    postAuthorName: 'CarapacePilot_35',
  },
  {
    id: 'b5b88859-30e2-406a-9cdf-3a362630ab31',
    handle: 'PincerScout_18',
    larvaId: 'LARVA UNIT #1874',
    stage: 1,
    joinSource: 'organic' as const,
    persona: {
      archetype: 'Benthic Pincer Scout',
      tone: 'Observant, cautious, quiet contributor surveying the lower depths.',
      bio: 'Surveying the upper trench shelves and studying canonical alignment scripts.',
      activityCadence: 'low' as const,
      lastSimulatedAt: new Date().toISOString(),
      traits: [
        {
          id: 'quiet_watcher',
          label: 'Quiet watcher',
          description: 'Absorbs lessons from the Ascendants before making a move.',
        },
      ],
    },
    avatarConfig: {
      style: 'pixel-art',
      seed: 'pincer-scout-seed-1874',
    },
    postAuthorName: null,
  },
]

export async function repurposeLegacyProfiles(options: ScriptOptions) {
  const { dryRun, databaseUrl } = options
  const sql = neon(databaseUrl)

  console.log(`[REPURPOSE] Starting legacy profile migration... (Mode: ${dryRun ? 'DRY-RUN' : 'LIVE EXECUTION'})`)

  // Step 0: Validate target accounts exist
  const [mrKrabsProfile] = await sql`SELECT id, handle FROM profiles WHERE id = ${MRKRABS_NEW_ID}`
  if (!mrKrabsProfile) {
    throw new Error(`[REPURPOSE] Target profile MrKrabs (${MRKRABS_NEW_ID}) was not found in profiles! Aborting.`)
  }
  console.log(`[REPURPOSE] ✓ Verified active destination user: ${mrKrabsProfile.handle} (${mrKrabsProfile.id})`)

  const [mstuppProfile] = await sql`SELECT id, handle, xp FROM profiles WHERE id = ${MSTUPP_OLD_ID}`
  if (!mstuppProfile) {
    console.log(`[REPURPOSE] ℹ Legacy profile mstupp (${MSTUPP_OLD_ID}) not found in profiles (already migrated?).`)
  } else {
    console.log(`[REPURPOSE] ✓ Found legacy profile: ${mstuppProfile.handle} (${mstuppProfile.id}) with ${mstuppProfile.xp} XP`)
  }

  // Step 1: Pre-cleanup friend requests to the purge list so foreign keys don't block
  console.log('\n--- Step 1: Friend requests referencing purged profiles ---')
  for (const purgeId of EMPTY_PROFILES_TO_PURGE) {
    const purgeReqs = await sql`
      SELECT count(*) FROM friend_requests 
      WHERE "recipientId" = ${purgeId} OR "senderId" = ${purgeId}
    `
    console.log(`[REPURPOSE] Friend requests referencing ${purgeId}: ${purgeReqs[0].count}`)
    if (!dryRun && Number(purgeReqs[0].count) > 0) {
      await sql`
        DELETE FROM friend_requests 
        WHERE "recipientId" = ${purgeId} OR "senderId" = ${purgeId}
      `
      console.log(`[REPURPOSE] Deleted ${purgeReqs[0].count} friend requests referencing ${purgeId}`)
    }
  }

  // Step 2: Merge mstupp into MrKrabs
  if (mstuppProfile) {
    console.log('\n--- Step 2: Merging mstupp data into MrKrabs ---')

    // 2.1 Routine completions
    const rcCount = (await sql`SELECT count(*) FROM routine_completions WHERE "userId" = ${MSTUPP_OLD_ID}`)[0].count
    console.log(`[REPURPOSE] Reassigning ${rcCount} routine_completions from mstupp -> MrKrabs`)
    if (!dryRun && Number(rcCount) > 0) {
      await sql`UPDATE routine_completions SET "userId" = ${MRKRABS_NEW_ID} WHERE "userId" = ${MSTUPP_OLD_ID}`
    }

    // 2.2 Forum posts
    const fpCount = (await sql`SELECT count(*) FROM forum_posts WHERE "userId" = ${MSTUPP_OLD_ID}`)[0].count
    console.log(`[REPURPOSE] Reassigning ${fpCount} forum_posts from mstupp -> MrKrabs (and updating authorName to 'MrKrabs')`)
    if (!dryRun && Number(fpCount) > 0) {
      await sql`UPDATE forum_posts SET "userId" = ${MRKRABS_NEW_ID}, "authorName" = 'MrKrabs' WHERE "userId" = ${MSTUPP_OLD_ID}`
    }

    // 2.3 Forum topics
    const ftCount = (await sql`SELECT count(*) FROM forum_topics WHERE "userId" = ${MSTUPP_OLD_ID}`)[0].count
    console.log(`[REPURPOSE] Reassigning ${ftCount} forum_topics from mstupp -> MrKrabs`)
    if (!dryRun && Number(ftCount) > 0) {
      await sql`UPDATE forum_topics SET "userId" = ${MRKRABS_NEW_ID}, "authorName" = 'MrKrabs' WHERE "userId" = ${MSTUPP_OLD_ID}`
    }

    // 2.4 Forum votes
    const fvCount = (await sql`SELECT count(*) FROM forum_votes WHERE "userId" = ${MSTUPP_OLD_ID}`)[0].count
    console.log(`[REPURPOSE] Reassigning ${fvCount} forum_votes from mstupp -> MrKrabs`)
    if (!dryRun && Number(fvCount) > 0) {
      await sql`UPDATE forum_votes SET "userId" = ${MRKRABS_NEW_ID} WHERE "userId" = ${MSTUPP_OLD_ID}`
    }

    // 2.5 Activity events
    const aeCount = (await sql`SELECT count(*) FROM activity_events WHERE "userId" = ${MSTUPP_OLD_ID}`)[0].count
    console.log(`[REPURPOSE] Reassigning ${aeCount} activity_events from mstupp -> MrKrabs`)
    if (!dryRun && Number(aeCount) > 0) {
      await sql`UPDATE activity_events SET "userId" = ${MRKRABS_NEW_ID} WHERE "userId" = ${MSTUPP_OLD_ID}`
    }

    // 2.6 XP transactions
    const xpCount = (await sql`SELECT count(*) FROM xp_transactions WHERE "userId" = ${MSTUPP_OLD_ID}`)[0].count
    console.log(`[REPURPOSE] Reassigning ${xpCount} xp_transactions from mstupp -> MrKrabs`)
    if (!dryRun && Number(xpCount) > 0) {
      await sql`UPDATE xp_transactions SET "userId" = ${MRKRABS_NEW_ID} WHERE "userId" = ${MSTUPP_OLD_ID}`
    }

    // 2.7 AI threads & messages
    const threadCount = (await sql`SELECT count(*) FROM ai_threads WHERE "userId" = ${MSTUPP_OLD_ID}`)[0].count
    console.log(`[REPURPOSE] Reassigning ${threadCount} ai_threads from mstupp -> MrKrabs`)
    if (!dryRun && Number(threadCount) > 0) {
      await sql`UPDATE ai_threads SET "userId" = ${MRKRABS_NEW_ID} WHERE "userId" = ${MSTUPP_OLD_ID}`
    }
    const msgCount = (await sql`SELECT count(*) FROM ai_messages WHERE "userId" = ${MSTUPP_OLD_ID}`)[0].count
    console.log(`[REPURPOSE] Reassigning ${msgCount} ai_messages from mstupp -> MrKrabs`)
    if (!dryRun && Number(msgCount) > 0) {
      await sql`UPDATE ai_messages SET "userId" = ${MRKRABS_NEW_ID} WHERE "userId" = ${MSTUPP_OLD_ID}`
    }

    // 2.8 Notifications
    const notifUser = (await sql`SELECT count(*) FROM notifications WHERE "userId" = ${MSTUPP_OLD_ID}`)[0].count
    const notifActor = (await sql`SELECT count(*) FROM notifications WHERE "actorUserId" = ${MSTUPP_OLD_ID}`)[0].count
    console.log(`[REPURPOSE] Reassigning notifications (user: ${notifUser}, actor: ${notifActor}) from mstupp -> MrKrabs`)
    if (!dryRun) {
      if (Number(notifUser) > 0) {
        await sql`UPDATE notifications SET "userId" = ${MRKRABS_NEW_ID} WHERE "userId" = ${MSTUPP_OLD_ID}`
      }
      if (Number(notifActor) > 0) {
        await sql`UPDATE notifications SET "actorUserId" = ${MRKRABS_NEW_ID} WHERE "actorUserId" = ${MSTUPP_OLD_ID}`
      }
    }

    // 2.9 Friend requests
    const freqCount = (await sql`SELECT count(*) FROM friend_requests WHERE "senderId" = ${MSTUPP_OLD_ID}`)[0].count
    console.log(`[REPURPOSE] Reassigning ${freqCount} friend_requests from mstupp -> MrKrabs`)
    if (!dryRun && Number(freqCount) > 0) {
      await sql`UPDATE friend_requests SET "senderId" = ${MRKRABS_NEW_ID} WHERE "senderId" = ${MSTUPP_OLD_ID}`
    }

    // 2.10 Friendships
    const currentFriendships = await sql`
      SELECT id, "userAId", "userBId" FROM friendships 
      WHERE "userAId" = ${MSTUPP_OLD_ID} OR "userBId" = ${MSTUPP_OLD_ID}
    `
    console.log(`[REPURPOSE] Re-normalizing ${currentFriendships.length} friendships for MrKrabs:`)
    for (const f of currentFriendships) {
      const friendId = f.userAId === MSTUPP_OLD_ID ? f.userBId : f.userAId
      const [uA, uB] = normalizeFriendPair(MRKRABS_NEW_ID, friendId)
      console.log(`  - Old: [${f.userAId}, ${f.userBId}] -> New: [${uA}, ${uB}]`)
      if (!dryRun) {
        await sql`DELETE FROM friendships WHERE id = ${f.id}`
        await sql`
          INSERT INTO friendships ("userAId", "userBId")
          VALUES (${uA}, ${uB})
          ON CONFLICT DO NOTHING
        `
      }
    }

    // 2.11 Update MrKrabs XP & delete old mstupp profile
    console.log(`[REPURPOSE] Updating MrKrabs profile with max XP (${mstuppProfile.xp}) and removing legacy mstupp profile`)
    if (!dryRun) {
      await sql`
        UPDATE profiles 
        SET xp = GREATEST(xp, ${mstuppProfile.xp}) 
        WHERE id = ${MRKRABS_NEW_ID}
      `
      await sql`DELETE FROM user_stats WHERE "userId" = ${MSTUPP_OLD_ID}`
      await sql`DELETE FROM profiles WHERE id = ${MSTUPP_OLD_ID}`
      console.log(`[REPURPOSE] ✓ Deleted legacy profile mstupp (${MSTUPP_OLD_ID})`)
    }
  }

  // Step 3: Convert 4 active legacy profiles into simulated acolytes
  console.log('\n--- Step 3: Converting active legacy profiles into simulated acolytes ---')
  for (const target of PROFILES_TO_SIMULATE) {
    const [existing] = await sql`SELECT id, handle, stage, "larvaId" FROM profiles WHERE id = ${target.id}`
    if (!existing) {
      console.log(`[REPURPOSE] Warning: profile ${target.id} not found in profiles!`)
      continue
    }

    console.log(`[REPURPOSE] Converting ${target.id} -> handle: "${target.handle}", archetype: "${target.persona.archetype}"`)
    if (!dryRun) {
      await sql`
        UPDATE profiles
        SET 
          handle = ${target.handle},
          "isSimulated" = true,
          "simulatedPersona" = ${JSON.stringify(target.persona)},
          "joinSource" = ${target.joinSource},
          "avatarConfig" = ${JSON.stringify(target.avatarConfig)}
        WHERE id = ${target.id}
      `

      // Ensure userStats row exists
      const existingStats = await sql`SELECT id FROM user_stats WHERE "userId" = ${target.id}`
      if (existingStats.length === 0) {
        await sql`
          INSERT INTO user_stats ("userId", "pincerTorque", "shellHardness", "processingPower", "durability", "clawStrength", "submergenceDepthRating")
          VALUES (${target.id}, 60, 55, 70, 65, 60, 1200)
          ON CONFLICT DO NOTHING
        `
      }

      // If they had forum posts, update authorName to display their new handle
      if (target.postAuthorName) {
        await sql`
          UPDATE forum_posts 
          SET "authorName" = ${target.postAuthorName} 
          WHERE "userId" = ${target.id}
        `
      }

      // If support tickets exist for them, update handle
      await sql`
        UPDATE support_tickets
        SET handle = ${target.handle}
        WHERE "userId" = ${target.id}
      `
    }
  }

  // Step 4: Safely purge 3 empty zero-activity ghost profiles
  console.log('\n--- Step 4: Purging 3 zero-activity ghost profiles ---')
  for (const emptyId of EMPTY_PROFILES_TO_PURGE) {
    const [prof] = await sql`SELECT id, "larvaId" FROM profiles WHERE id = ${emptyId}`
    if (prof) {
      console.log(`[REPURPOSE] Purging ghost profile ${emptyId} (${prof.larvaId})`)
      if (!dryRun) {
        await sql`DELETE FROM notifications WHERE "userId" = ${emptyId} OR "actorUserId" = ${emptyId}`
        await sql`DELETE FROM user_stats WHERE "userId" = ${emptyId}`
        await sql`DELETE FROM profiles WHERE id = ${emptyId}`
        console.log(`[REPURPOSE] ✓ Deleted ghost profile ${emptyId}`)
      }
    } else {
      console.log(`[REPURPOSE] ℹ Ghost profile ${emptyId} already purged.`)
    }
  }

  console.log(`\n[REPURPOSE] ${dryRun ? 'DRY-RUN completed. No changes written.' : 'Migration completed successfully!'}`)
}

async function main() {
  const args = process.argv.slice(2)
  const isProd = args.includes('--prod')
  const isDev = args.includes('--dev')
  const execute = args.includes('--execute')
  const dryRun = !execute

  let databaseUrl = process.env.DATABASE_URL
  if (isProd) {
    databaseUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL
  } else if (isDev) {
    databaseUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL
  }

  if (!databaseUrl) {
    console.error('[REPURPOSE] Error: No DATABASE_URL or PROD_DATABASE_URL found.')
    process.exit(1)
  }

  try {
    const url = new URL(databaseUrl)
    console.log(`[REPURPOSE] Connecting to DB host: ${url.host} (target: ${isProd ? 'PROD' : isDev ? 'DEV' : 'DEFAULT'})`)
  } catch {
    console.log('[REPURPOSE] Connecting to DB...')
  }

  try {
    await repurposeLegacyProfiles({ dryRun, databaseUrl })
    process.exit(0)
  } catch (err) {
    console.error('[REPURPOSE] ❌ Migration failed:', err)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
