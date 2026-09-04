/**
 * One-shot forum seed for environments whose forum tables are empty.
 * Usage: DATABASE_URL=... npx tsx scripts/seed-forum-only.ts
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../src/db/schema'
import { INITIAL_FORUM_CATEGORIES, INITIAL_FORUM_TOPICS } from '../src/lib/forum-seed-data'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  const db = drizzle(neon(url), { schema })

  for (const cat of INITIAL_FORUM_CATEGORIES) {
    await db
      .insert(schema.forumCategories)
      .values({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
      })
      .onConflictDoNothing({ target: schema.forumCategories.slug })
  }
  console.log(`✓ categories: ${INITIAL_FORUM_CATEGORIES.length}`)

  for (const topic of INITIAL_FORUM_TOPICS) {
    await db
      .insert(schema.forumTopics)
      .values({
        id: topic.id,
        categoryId: topic.categoryId,
        userId: null,
        authorName: topic.authorName,
        authorAvatar: topic.authorAvatar,
        authorStage: topic.authorStage,
        title: topic.title,
        slug: topic.slug,
        content: topic.content,
        isPinned: topic.isPinned,
        isLocked: topic.isLocked,
        views: topic.views,
        repliesCount: topic.repliesCount,
        upvotes: topic.upvotes,
        lastReplyAt: new Date(topic.lastReplyAt),
        createdAt: new Date(topic.createdAt),
      })
      .onConflictDoNothing({ target: schema.forumTopics.slug })

    for (const p of topic.posts || []) {
      await db
        .insert(schema.forumPosts)
        .values({
          id: p.id,
          topicId: p.topicId,
          parentId: p.parentId ?? null,
          userId: null,
          authorName: p.authorName,
          authorAvatar: p.authorAvatar,
          authorStage: p.authorStage,
          content: p.content,
          upvotes: p.upvotes,
          createdAt: new Date(p.createdAt),
        })
        .onConflictDoNothing()
    }
  }
  console.log(`✓ topics: ${INITIAL_FORUM_TOPICS.length}`)
  console.log('Forum seed complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
