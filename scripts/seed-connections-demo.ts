import { getDb } from '../src/db'
import { friendRequests, friendships, notifications, profiles } from '../src/db/schema'
import { eq, or, and } from 'drizzle-orm'
import { friendRequestSourceKey } from '../src/lib/notifications'
import { buildFriendNotificationCopy } from '../src/lib/connections'

async function main() {
  const db = getDb()
  const me = '27b62c18-5839-4466-bb96-c078e6a87215'
  const architect = '00000000-0000-0000-0000-000000000002'
  const ascendant = '00000000-0000-0000-0000-000000000003'

  await db
    .delete(friendRequests)
    .where(or(eq(friendRequests.recipientId, me), eq(friendRequests.senderId, me)))
  await db
    .delete(friendships)
    .where(or(eq(friendships.userAId, me), eq(friendships.userBId, me)))
  await db.delete(notifications).where(eq(notifications.userId, me))

  const [a, b] = me < architect ? [me, architect] : [architect, me]
  await db.insert(friendships).values({ userAId: a, userBId: b }).onConflictDoNothing()

  const [req] = await db
    .insert(friendRequests)
    .values({
      senderId: ascendant,
      recipientId: me,
      status: 'pending',
    })
    .returning()

  const [sender] = await db.select().from(profiles).where(eq(profiles.id, ascendant)).limit(1)
  const copy = buildFriendNotificationCopy('friend_request', sender?.larvaId || 'ASCENDANT')
  await db.insert(notifications).values({
    userId: me,
    kind: 'friend_request',
    actorUserId: ascendant,
    title: copy.title,
    detail: copy.detail,
    payload: { requestId: req.id, profileId: ascendant },
    sourceKey: friendRequestSourceKey(req.id),
  })

  console.log('seeded friend + incoming request', req.id)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
