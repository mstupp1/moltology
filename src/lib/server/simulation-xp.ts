import { xpTransactions } from '../../db/schema'
import { XP_CONFIG } from '../progression'
import { TOTAL_ALIGNMENT_TASKS } from '../alignment-tasks'
import { syncUserProgression } from './db-services'

type Db = Parameters<typeof syncUserProgression>[0]

/**
 * Simulated members earn task XP on the same ledger and keys as real members, so they show
 * on the weekly leaderboard. Progression is synced first: a simulated member created at a
 * later stage gets their legacy XP seeded before the first task row, so the new XP never
 * drops them back to Stage 1.
 */
export async function awardSimulatedTaskXp(
  db: Db,
  userId: string,
  taskKeys: string[],
  date: string,
  at?: Date,
): Promise<void> {
  if (taskKeys.length === 0) return
  await syncUserProgression(db, userId)

  const rows = taskKeys.map((taskKey) => ({
    userId,
    amount: XP_CONFIG.taskCompletionXp,
    source: 'task_completion',
    sourceKey: `routine:${taskKey}:${date}`,
    description: 'Completed liturgy',
    ...(at ? { createdAt: at } : {}),
  }))
  if (taskKeys.length >= TOTAL_ALIGNMENT_TASKS) {
    rows.push({
      userId,
      amount: XP_CONFIG.allTasksDailyBonusXp,
      source: 'all_tasks_bonus',
      sourceKey: `routine_all:${date}`,
      description: `Daily Alignment Complete: All ${TOTAL_ALIGNMENT_TASKS} liturgies executed`,
      ...(at ? { createdAt: at } : {}),
    })
  }
  await db.insert(xpTransactions).values(rows).onConflictDoNothing()
  await syncUserProgression(db, userId)
}
