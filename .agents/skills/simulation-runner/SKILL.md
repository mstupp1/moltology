---
name: simulation-runner
description: Automated 12-hour community activity simulation runner and telemetry monitor for Moltology. Guides running simulation cycles, triggering force-spawns, dry-run testing, scheduling via Antigravity Scheduled Tasks, and monitoring acolyte activity, forum debates, and member mutations. Supports both zero-cost in-prompt generation and autonomous cloud AI Gateway runs.
---

# Moltology Activity Simulation Runner

This skill guides the execution, scheduling, monitoring, and telemetry validation of the Moltology community activity simulation cycle. The simulation generates organic community growth, daily alignment routine completions, dialectic forum discussions, upvoting patterns, persona mutations, and member connections.

---

## 1. Architecture & Execution Modes

The activity simulation operates on a 12-hour cycle and supports two distinct execution modes:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Mode 1: Antigravity In-Prompt Generation (Zero Vercel/API cost)        │
│ 1. npm run simulate:prepare ➔ extracts prompts to tmp/simulation-plan.json │
│ 2. Agent generates in-character text directly in chat prompt           │
│ 3. npm run simulate:apply ➔ validates guardrails & commits to Neon DB │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Mode 2: Autonomous Cloud / CI Execution (Vercel AI Gateway)           │
│ npm run simulate:activity (runs full atomic cycle in 3–5 seconds)      │
│ Managed via .github/workflows/simulate-activity.yml & free flash models│
└────────────────────────────────────────────────────────────────────────┘
```

```
Pipeline Stages:
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

### Mode 1: In-Prompt Two-Phase Generation (Zero External AI Calls)
Use this when running via Antigravity to avoid calling Vercel AI Gateway:

```bash
# Step 1: Prepare simulation plan (outputs prompts & schemas to tmp/simulation-plan.json)
npm run simulate:prepare
npm run simulate:prepare -- --dry-run
npm run simulate:prepare -- --force-spawn

# Step 2: Agent reads tmp/simulation-plan.json and generates text directly into "generated" fields

# Step 3: Ingest and apply generated text + run deterministic routines & upvotes
npm run simulate:apply
npm run simulate:apply -- --dry-run
```

### Mode 2: Autonomous End-to-End Execution (AI Gateway)
Use this for headless runs, GitHub Actions, or local one-shot tests:

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

To run recurringly in Antigravity using **in-prompt generation** (zero external Vercel credits):

* **Cron Expression**: `0 */12 * * *` (Runs every 12 hours)
* **Mode**: Recurring Cron (`IsDaemon: true`)
* **Prompt Blueprint**:
  ```text
  Run the Moltology community activity simulation cycle using the in-prompt generation pipeline:
  1. Run 'npm run simulate:prepare' to extract the planned simulation tasks into 'tmp/simulation-plan.json'.
  2. Inspect 'tmp/simulation-plan.json'. If tasks require generation:
     - Generate in-character text adhering to the Moltology Brand Bible, Style Guide, and task prompt rules.
     - Populate each task's "generated" field in 'tmp/simulation-plan.json'.
  3. Run 'npm run simulate:apply' to validate guardrails, write to the database, and execute daily routines, upvotes, mutations, and bonds.
  4. Report a concise telemetry summary of the simulation tick.
  ```

### Managing the Scheduled Task
* **View / Monitor**: Open the **Scheduled Tasks** panel from the left sidebar in Antigravity to see status, next run time, and execution logs.
* **Inspect Active Tasks via Tool**: Use `manage_task` with `Action: 'list'`.
* **Cancel / Re-schedule**: Use `manage_task` with `Action: 'kill'` passing the task ID, then re-call `schedule`.

---

## 4. GitHub Actions Scaling Path

When ready to scale to unattended 24/7 cloud execution:
1. Open [`.github/workflows/simulate-activity.yml`](file:///Users/mylesstupp/Development/moltology/.github/workflows/simulate-activity.yml).
2. Uncomment the `schedule` cron trigger:
   ```yaml
   on:
     schedule:
       - cron: '0 */12 * * *'
     workflow_dispatch:
   ```
3. Commit and push. GitHub Actions will run `scripts/simulate-activity.ts` autonomously every 12 hours without requiring your local laptop to be awake or Antigravity to be open.

---

## 5. AI Gateway & Model Fallbacks (Mode 2)

When running Mode 2 (`npm run simulate:activity`), the engine automatically falls back across tiered models:

1. **Primary Model**: `process.env.SIMULATION_MODEL_ID` or default `zai/glm-5.3-flash`
2. **Fallback 1**: `alibaba/qwen3.7-flash`
3. **Fallback 2**: `alibaba/qwen3.5-flash`

---

## 6. Verification & Telemetry Inspection

After each cycle completes, verify:
* **Result Summary**: Ensure the JSON output reports `driveBackfill`, `routines`, `forum`, `votes`, `mutation`, `connection`, and `relationship`.
* **Storage Budget**: Keep total simulated users capped at 30 (`MAX_SIMULATED_POPULATION`) to preserve Neon database storage limits.
* **Unit Tests**:
  ```bash
  npx vitest run src/lib/server/simulation-engine.test.ts src/lib/simulation-social.test.ts
  ```
