---
name: simulation-runner
description: Automated weekly community activity simulation runner and telemetry monitor for Moltology. By default each run simulates a full week of activity (14 ticks) against production. Guides running simulation cycles, triggering force-spawns, dry-run testing, scheduling via Antigravity Scheduled Tasks, and monitoring acolyte activity, forum debates, and member mutations. Supports both zero-cost in-prompt generation and autonomous cloud AI Gateway runs.
---

# Moltology Activity Simulation Runner

This skill guides the execution, scheduling, monitoring, and telemetry validation of the Moltology community activity simulation cycle. The simulation generates organic community growth, daily alignment routine completions, dialectic forum discussions, upvoting patterns, persona mutations, and member connections.

---

## Production target (default)

Scheduled and ordinary simulation runs are intended to populate the **production app at moltology.org**, using Neon `main`. A request to run this skill authorizes its normal production simulation cycle. Use development only when the user explicitly requests a development run or test.

Local `.env` `DATABASE_URL` normally points to **dev**. Never run the bare commands below against that default for a production cycle. Load `.env`, require `PROD_DATABASE_URL`, and pass it as `DATABASE_URL` to the child process without changing `.env` or printing credentials. For example, from the repository root:

```bash
node -e 'const { config } = require("dotenv"); const { spawnSync } = require("node:child_process"); config({ quiet: true }); const target = process.env.PROD_DATABASE_URL; if (!target) throw new Error("PROD_DATABASE_URL is required; production simulation was not started"); console.log("Simulation target: production", new URL(target).hostname); const result = spawnSync("npm", process.argv.slice(1), { stdio: "inherit", env: { ...process.env, DATABASE_URL: target } }); if (result.error) throw result.error; process.exit(result.status ?? 1);' -- run simulate:activity
```

For two-phase generation, use this same wrapper with `run simulate:prepare` and then `run simulate:apply`; both phases must use the same production target. Scoped flags and `--dry-run` follow the npm command after `--`. Dry-run does not write, but still explicitly select the intended database.

**Default cadence: weekly.** The skill is scheduled to run once per week, so every invocation of this skill (unless the user says otherwise) must simulate a full week of activity: 14 sequential ticks (7 days × 2 ticks/day). Use the production wrapper with `run simulate:weekly` (equivalent to `simulate:activity -- --weekly`). Do not run a single tick or the daily batch for a scheduled/ordinary invocation. Only use `simulate:daily` or `simulate:activity` when the user explicitly asks for a daily run, a single tick, or a scoped/test run.

In GitHub Actions, `secrets.DATABASE_URL` must target production Neon `main`. The workflow's scheduled trigger is disabled; the recurring job is a local automation that runs once per week. Local recurring runs require the host to be awake and able to execute the automation. Do not enable a second scheduler alongside it, and never invoke `simulate:weekly` twice for the same week.

Weekly mode (`simulate:weekly`, gateway generation) runs its 14 ticks immediately with no waiting, oldest first. Each tick is stamped with its own simulated time: the 7 days ending now are cut into 14 twelve-hour slots and a tick lands at a random point in each (`--no-spread` disables this and stamps everything with the real time). After a tick commits, the rows it wrote for simulated members (topics, replies, votes, activity events, notifications, friendships, bonds, new profiles) are shifted back to the tick's time; routine completions are written with the simulated date directly. Real members' rows are never moved. If a tick throws before finishing, its rows keep real timestamps. Scoped flags apply to every tick; `--force-spawn` forces every spawn attempt. Per-tick probabilities, budgets, and population caps are unchanged. Summaries are printed after each tick, and failure stops the batch without retries. `--weekly` cannot be combined with `--daily`.

**In-prompt weekly generation is batched into two waves** (one generation pass per wave instead of 14 prepare/apply rounds). Wave 1 covers the first 7 ticks, wave 2 the last 7; wave 2 is prepared after wave 1 is applied so its replies can target wave 1's topics. For each wave, with the production wrapper:
1. `run simulate:prepare -- --weekly --wave <1|2>` writes `tmp/simulation-week-plan.json` with 7 ticks (wave 1 also saves `tmp/simulation-week-schedule.json`; wave 2 reuses it). Duplicate replies across ticks and spawns beyond the population cap are dropped at prepare time.
2. Read the plan and fill every task's `generated` field across all ticks in one pass.
3. `run simulate:apply -- --weekly` applies the ticks in order, each at its scheduled time. Missing generated text anywhere fails before anything is written. Progress is saved per tick (`applied: true`), so re-running after a failure skips committed ticks. Never edit those flags back.
4. Verify each wave against the production database, then do wave 2.

Daily mode (`run simulate:daily`, 2 ticks) remains available for explicit requests only and is not time-spread.


After applying each tick, query the production database to confirm the returned topic/reply IDs exist. Report the production target, actual inserted activity, and a verified `https://moltology.org/forum/<categorySlug>/<topicSlug>` link when a topic or reply was created. A successful command or `dryRun=false` alone does not prove the production app received it. Save target and verification in automation memory. Do not repeat a committed tick just because later verification fails; investigate the committed IDs first.

---

## 1. Architecture & Execution Modes

The weekly schedule runs 14 sequential ticks (7 days × 2) in one job. Activity arrives together at the weekly run time; recency-based choices can differ between ticks. The activity simulation supports two distinct execution modes:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Mode 1: Antigravity In-Prompt Generation (Zero Vercel/API cost)        │
│ 1. npm run simulate:prepare ➔ extracts prompts to tmp/simulation-plan.json │
│ 2. Agent generates in-character text directly in chat prompt           │
│ 3. npm run simulate:apply ➔ validates guardrails & commits to Neon DB │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Mode 2: Autonomous Cloud / CI Execution (Vercel AI Gateway)           │
│ npm run simulate:weekly (runs 14 sequential ticks)     │
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
# One simulation tick (manual/scoped use)
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

* **Cron Expression**: `0 0 * * 0` (Runs once weekly, Sunday; choose the hour in the scheduler timezone)
* **Mode**: Recurring Cron (`IsDaemon: true`)
* **Prompt Blueprint**:
  ```text
  Run a full week of Moltology community activity against production using the batched in-prompt pipeline, in two waves of 7 ticks (14 ticks total, 7 days x 2). Use the production wrapper for every npm command.
  For wave 1, then wave 2 (only after wave 1 is applied and verified):
  1. Run 'npm run simulate:prepare -- --weekly --wave N' to write 'tmp/simulation-week-plan.json' (7 scheduled ticks).
  2. Inspect the plan. In ONE pass, generate in-character text for every task across all ticks, adhering to the Moltology Brand Bible, Style Guide, and task prompt rules, and populate each task's "generated" field.
  3. Run 'npm run simulate:apply -- --weekly' to apply the ticks in order, each backdated to its scheduled time.
  4. Verify the committed IDs and results for the wave against production and save them.
  Report both waves' summaries. Stop on failure; never blindly retry committed or partially committed ticks (re-running apply skips ticks already marked applied).
  (Alternative without in-prompt generation: run 'simulate:weekly' once via the production wrapper, then verify.)
  ```

### Managing a legacy Antigravity Scheduled Task
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
       - cron: '0 0 * * 0'
     workflow_dispatch:
   ```
3. Commit and push. GitHub Actions will run `scripts/simulate-activity.ts` autonomously once weekly, with 14 sequential ticks per job (`simulate:weekly`) without requiring your local laptop to be awake or Antigravity to be open.

---

## 5. AI Gateway & Model Fallbacks (Mode 2)

When running Mode 2 (`npm run simulate:activity`), the engine automatically falls back across tiered models:

1. **Primary Model**: `process.env.SIMULATION_MODEL_ID` or default `zai/glm-5.3-flash`
2. **Fallback 1**: `alibaba/qwen3.7-flash`
3. **Fallback 2**: `alibaba/qwen3.5-flash`

---

## 6. Verification & Telemetry Inspection

After each cycle completes, verify the production target and inserted IDs as described above, then check:
* **Result Summary**: Ensure the JSON output reports `driveBackfill`, `routines`, `forum`, `votes`, `mutation`, `connection`, and `relationship`.
* **Storage Budget**: Keep total simulated users capped at 30 (`MAX_SIMULATED_POPULATION`) to preserve Neon database storage limits.
* **Unit Tests**:
  ```bash
  npx vitest run src/lib/server/simulation-engine.test.ts src/lib/simulation-social.test.ts
  ```
