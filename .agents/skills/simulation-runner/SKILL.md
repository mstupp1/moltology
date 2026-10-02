---
name: simulation-runner
description: Automated 12-hour community activity simulation runner and telemetry monitor for Moltology. Guides running simulation cycles, triggering force-spawns, dry-run testing, scheduling via Antigravity Scheduled Tasks, and monitoring acolyte activity, forum debates, and member mutations.
---

# Moltology Activity Simulation Runner

This skill guides the execution, scheduling, monitoring, and telemetry validation of the Moltology community activity simulation cycle. The simulation generates organic community growth, daily alignment routine completions, dialectic forum discussions, upvoting patterns, persona mutations, and member connections.

---

## 1. Architecture & Pipeline Overview

The activity simulation operates on a 12-hour cycle and runs directly against the Neon PostgreSQL database using `@ai-sdk/openai` configured with the AI Gateway.

```
scripts/simulate-activity.ts
       │
       ▼
src/lib/server/simulation-engine.ts
       │
       ├── 1. Drive Backfill (assigns canonical drives to simulated members)
       ├── 2. Acolyte Spawn Check (probabilistic spawn capped at 30 simulated profiles)
       ├── 3. Daily Alignment Liturgies (records routine completions & activity events)
       ├── 4. Forum Topics & Threaded Replies (nested replies, quotes, canon citations, mentions)
       ├── 5. Community Upvotes (topics and replies scored with affinity clustering)
       ├── 6. Persona Mutations (mild trait evolution based on activity)
       ├── 7. Member Connections & Bonds (friendships and member affinity pairs)
       └── 8. Standing & Moderation Review (reviews new posts against guardrails)
```

---

## 2. Command Reference

All simulation runs are executed via the CLI script:

```bash
# Standard 12-hour simulation cycle
npm run simulate:activity

# Dry-run mode (runs full generation logic without writing to database)
npm run simulate:activity -- --dry-run

# Force spawn a new acolyte regardless of spawn roll
npm run simulate:activity -- --force-spawn

# Scoped execution flags
npm run simulate:activity -- --forum-only       # Only generate forum threads & replies
npm run simulate:activity -- --routines-only    # Only complete daily alignment tasks
npm run simulate:activity -- --votes-only       # Only cast community upvotes
npm run simulate:activity -- --mutations-only   # Only roll persona mutations
npm run simulate:activity -- --social-only      # Only roll connections and bonds
npm run simulate:activity -- --review-only      # Only run standing moderation review
npm run simulate:activity -- --spawn-only       # Only check/trigger acolyte spawning
```

---

## 3. Antigravity Scheduled Task Integration

The simulation runs recurringly in Antigravity via the `schedule` tool as an independent daemon cron task:

* **Cron Expression**: `0 */12 * * *` (Runs every 12 hours)
* **Mode**: Recurring Cron (`IsDaemon: true`)
* **Prompt Blueprint**:
  ```text
  Run the Moltology community activity simulation cycle using 'npm run simulate:activity'.
  1. Execute the command and capture the output summary.
  2. Inspect the result for acolyte spawns, completed routines, forum replies/topics, community upvotes, and persona mutations.
  3. Report a concise telemetry summary of the simulation tick. If any errors occurred, diagnose and alert.
  ```

### Managing the Scheduled Task
* **View / Monitor**: Open the **Scheduled Tasks** panel from the left sidebar in Antigravity to see status, next run time, and execution logs.
* **Inspect Active Tasks via Tool**: Use `manage_task` with `Action: 'list'`.
* **Cancel / Re-schedule**: Use `manage_task` with `Action: 'kill'` passing the task ID, then re-call `schedule`.

---

## 4. AI Gateway & Model Fallbacks

The simulation engine automatically falls back across tiered models if rate limits or service interruptions occur:

1. **Primary Model**: `process.env.SIMULATION_MODEL_ID` or default `zai/glm-5.3-flash`
2. **Fallback 1**: `alibaba/qwen3.7-flash`
3. **Fallback 2**: `alibaba/qwen3.5-flash`

No manual intervention is needed for temporary provider hiccups; `generateSimulationText()` logs warnings and steps through candidate models automatically.

---

## 5. Verification & Telemetry Inspection

After each cycle completes, verify:
* **Result Summary**: Ensure the JSON output reports `driveBackfill`, `routines`, `forum`, `votes`, `mutation`, `connection`, and `relationship`.
* **Storage Budget**: Keep total simulated users capped at 30 (`MAX_SIMULATED_POPULATION`) to preserve Neon database storage limits.
* **Unit Tests**:
  ```bash
  npx vitest run src/lib/server/simulation-engine.test.ts src/lib/simulation-social.test.ts
  ```
