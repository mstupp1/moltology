/**
 * Dev-only smoke test for connections / public profile handlers against Neon.
 * Usage: npx tsx scripts/smoke-connections.ts
 */
import { getDb } from '../src/db'
import {
  searchMembersHandler,
  sendFriendRequestHandler,
  respondFriendRequestHandler,
  listConnectionsHandler,
  getPublicProfileHandler,
  getMemberLoadoutHandler,
  getNotificationsHandler,
  cancelFriendRequestHandler,
  removeConnectionHandler,
} from '../src/lib/server/api'
import { profiles, friendRequests, friendships, notifications } from '../src/db/schema'
import { eq, or, and } from 'drizzle-orm'

async function main() {
  const db = getDb()
  const rows = await db
    .select({ id: profiles.id, larvaId: profiles.larvaId })
    .from(profiles)
    .limit(20)

  const sender = rows.find((r) => r.id === '27b62c18-5839-4466-bb96-c078e6a87215') || rows.find((r) => !r.id.startsWith('00000000'))
  const recipient = rows.find((r) => r.larvaId.includes('ARCHITECT')) || rows.find((r) => r.id !== sender?.id)

  if (!sender || !recipient) {
    throw new Error('Need at least two profiles for smoke test')
  }

  console.log('[smoke] sender', sender.id, sender.larvaId)
  console.log('[smoke] recipient', recipient.id, recipient.larvaId)

  // Clean prior state between these two
  await db
    .delete(friendRequests)
    .where(
      or(
        and(eq(friendRequests.senderId, sender.id), eq(friendRequests.recipientId, recipient.id)),
        and(eq(friendRequests.senderId, recipient.id), eq(friendRequests.recipientId, sender.id))
      )
    )
  const [a, b] = sender.id < recipient.id ? [sender.id, recipient.id] : [recipient.id, sender.id]
  await db.delete(friendships).where(and(eq(friendships.userAId, a), eq(friendships.userBId, b)))
  await db.delete(notifications).where(or(eq(notifications.userId, sender.id), eq(notifications.userId, recipient.id)))

  const ctx = { db, user: { sub: sender.id, id: sender.id } }
  const recipientCtx = { db, user: { sub: recipient.id, id: recipient.id } }

  const search = await searchMembersHandler({
    data: { query: 'ARCHITECT' },
    context: ctx,
  })
  console.log('[smoke] search hits', search.length, search.map((s) => s.larvaId))
  if (search.length < 1) throw new Error('search failed')

  const profile = await getPublicProfileHandler({
    data: { profileId: recipient.id },
    context: ctx,
  })
  console.log('[smoke] public profile', profile?.larvaId, profile?.relationship, profile?.stageLabel)

  const loadout = await getMemberLoadoutHandler({
    data: { profileId: recipient.id },
    context: ctx,
  })
  console.log('[smoke] loadout items', loadout.items.length, 'totals', loadout.totals)

  const sent = await sendFriendRequestHandler({
    data: { recipientId: recipient.id },
    context: ctx,
  })
  console.log('[smoke] sent request', sent)

  const notifs = await getNotificationsHandler({
    data: {},
    context: recipientCtx,
  })
  console.log('[smoke] recipient unread', notifs.unreadCount, notifs.notifications[0]?.title)

  const accepted = await respondFriendRequestHandler({
    data: { requestId: sent.requestId, action: 'accept' },
    context: recipientCtx,
  })
  console.log('[smoke] accepted', accepted)

  const connections = await listConnectionsHandler({ data: {}, context: ctx })
  console.log(
    '[smoke] friends',
    connections.friends.map((f) => f.larvaId),
    'incoming',
    connections.incoming.length,
    'outgoing',
    connections.outgoing.length
  )
  if (!connections.friends.some((f) => f.id === recipient.id)) {
    throw new Error('friendship not listed')
  }

  const after = await getPublicProfileHandler({
    data: { profileId: recipient.id },
    context: ctx,
  })
  console.log('[smoke] relationship after accept', after?.relationship)
  if (after?.relationship !== 'friends') throw new Error('expected friends')

  await removeConnectionHandler({
    data: { friendId: recipient.id },
    context: ctx,
  })
  console.log('[smoke] removed connection')

  // Second pass: send + cancel
  const sent2 = await sendFriendRequestHandler({
    data: { recipientId: recipient.id },
    context: ctx,
  })
  await cancelFriendRequestHandler({
    data: { requestId: sent2.requestId },
    context: ctx,
  })
  console.log('[smoke] cancel ok')

  console.log('[smoke] ALL PASSED')
}

main().catch((err) => {
  console.error('[smoke] FAILED', err)
  process.exit(1)
})
