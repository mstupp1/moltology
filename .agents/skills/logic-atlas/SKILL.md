---
name: logic-atlas
description: >-
  Refresh the admin Logic Atlas at /admin/logic: re-verify business rules against the code, log new
  decisions from recent PRs and changelogs, and regenerate the atlas data. Use whenever the user asks to
  update, refresh, sync, or audit the Logic Atlas, business logic map, rules map, or decision log, or
  asks to record a new business-logic decision.
---

# Logic Atlas Refresh

The Logic Atlas is a staff-only map of the app's business logic. It shows each rule, where it lives in code, what the code currently says, how rules depend on each other, and the decisions behind them. This skill is the only thing that updates it. CI does not check it.

---

## 1. How the atlas is built

| Layer | Location | Edited by |
| :--- | :--- | :--- |
| Domains and rules | `docs/logic/domains/<domain>.md` (YAML frontmatter + a short overview) | You |
| Decision records | `docs/logic/decisions/YYYY-MM-DD-<slug>.md` | You |
| Verified anchor hashes | `docs/logic/anchors.lock.json` | The script (`--accept`) |
| Generated atlas | `src/lib/server/logic-atlas.generated.ts` | The script (`logic:sync`) |
| Generator | `scripts/sync-logic-atlas.ts` + `scripts/lib/logic-atlas/` | Engineering changes only |
| Page | `/admin/logic` (`src/components/admin/logic-atlas/`) | Engineering changes only |

- **Anchors** tie a rule to code. `symbol` is a top-level name (`FORUM_TRENDING_QUALITY_MIN`), a dotted path into an object or call (`profiles.chitinGems`, `auth.minPasswordLength`, `XP_CONFIG.streakMilestones`), a Markdown heading (`4.4 The Red Line`), or a line snippet in YAML/JSON (`npm run db:migrate`).
- **Drift**: the script hashes each anchored declaration. `ok` means it matches the lock, `changed` means the code changed since the rule was last verified, `missing` means the symbol or file is gone, and `unverified` means there is no lock entry yet.
- The atlas is served only to staff through `getLogicAtlasFn`. It is never bundled for the client, because it describes screening thresholds and known gaps.

---

## 2. Schemas

### Rule (inside a domain's `rules:` list)

```yaml
- id: forum.hot-feed-quality        # <domain>.<slug>, lowercase, never reused
  title: Quality 50 for Hot          # 3-60 chars, sentence case
  kind: threshold                    # gate | threshold | invariant | flow | limit | permission
  status: active                     # active | soft-launch | deprecated
  statement: Posts that score under 50 of 100 are stored but kept out of the Hot feed.
  dependsOn: [forum.quarantine]      # rules this one relies on (draws the graph edges)
  anchors:
    - file: src/lib/quality/forum-gate.ts
      symbol: FORUM_TRENDING_QUALITY_MIN
  tests: [src/lib/quality/forum-gate.test.ts]
  flag:                              # optional: a known gap or something to watch
    level: gap                       # gap = real risk, watch = worth keeping an eye on
    note: What is wrong and what would fix it.
  flow:                              # optional, for multi-step logic (kind: flow)
    - id: start
      label: Post submitted          # max 60 chars
      kind: start                    # start | check | action | outcome
      next: [check]
    - id: check
      label: Quality under 50?
      next:
        - { to: quiet, label: 'yes' }
        - { to: hot, label: 'no' }
    - id: quiet
      label: Stored, kept out of Hot
      kind: outcome
      tone: warn                     # neutral | allow | block | warn
```

### Decision record

```markdown
---
id: jev-quality-gates                # unique slug
date: 2026-09-23                     # merge date of the PR, YYYY-MM-DD
title: "Gate forum posts and Oracle prompts with Jev"
summary: "One sentence a scanning reader understands."
domains: [forum, oracle]
rules: [forum.quarantine, oracle.jailbreak-gate]
status: accepted                     # accepted | superseded (then set supersededBy)
sources:
  - pr: 152
  - commit: 605ba42a886a85e41d0968fe5a5d8e7378c0f7b2
  - changelog: 2026-09-05-stage-xp-progression-advanced-forum-tools-launchpad-carousel
  - doc: BRAND_BIBLE.md
---

## Context
## Decision
## Alternatives
## Consequences
```

---

## 3. Workflow

### Step 1. See what needs attention

```bash
npm run logic:check
```

This prints validation errors and every anchor that is not `ok`. It exits with an error when anything needs work. That is expected at the start of a run.

### Step 2. Find what changed since the last sync

The last sync date is `syncedAt` in `src/lib/server/logic-atlas.generated.ts`.

```bash
git log --since=<syncedAt> --format='%h %ad %s' --date=short
gh pr list --state merged --search "merged:>=<syncedAt>" --json number,title,mergedAt,body --limit 50
ls content/changelogs | sort | tail
```

For each merged PR, decide whether it changed business logic. Business logic is anything that changes what members can do, see, earn, or pay; thresholds and limits; access and roles; money and the economy; screening and moderation; data handling and retention; and cost guardrails. Pure UI polish, copy tweaks, refactors, and content posts are not.

### Step 3. Resolve drift

For each `changed` anchor:
1. Read the anchored code (`file:line` from the check output) and the diff (`git log -p -S <symbol>`).
2. If the rule's meaning changed, update its `statement`, `flag`, `flow`, or `dependsOn`. If only formatting or internals changed, leave the text.
3. Re-verify just that rule: `npm run logic:sync -- --accept <rule.id>` (comma-separate several ids).

For each `missing` anchor, find where the logic moved and fix `file` or `symbol`. If the logic was removed, set `status: deprecated` or delete the rule and drop it from any `dependsOn` and decision `rules` lists.

Never run `--accept all` to silence drift you did not read. Use it only for a brand-new atlas.

### Step 4. Add or update rules

- New logic belongs in the closest existing domain. Add a new domain file only for a genuinely new area, and give it the next `order` and a distinct color.
- Aim for 5 to 14 rules per domain. Split a rule that needs "and also" in its statement.
- Anchor every rule to at least one symbol, preferring constants and pure decision functions over large handlers.
- Add `flag` when the code has a real gap (for example, a client-only check or a missing staff gate) or a caveat worth watching. Close or remove the flag when the gap is fixed, and log a decision if the fix was a choice.
- Keep the economy red line visible. Any rule touching Premium, Molt Credits, Gems, rank, clearance, stage, or forum authority must depend on `economy.red-line` or `economy.two-currencies`.

### Step 5. Write decision records

One record per real decision, usually one per PR. Mine the PR body for context and trade-offs. When a PR only says what changed, state the decision plainly and list the alternatives it rules out. Link every rule the decision shaped. When a new decision reverses an old one, set the old one to `status: superseded` with `supersededBy`.

### Step 6. Rebuild and verify

```bash
npm run logic:sync -- --accept <every rule id you re-verified>
npm run logic:check
npx vitest run scripts/lib/logic-atlas src/lib/logic-atlas src/components/admin/logic-atlas
npm run typecheck
```

`logic:check` should exit cleanly. Then summarize for the user: rules added, changed, and retired, decisions added, flags opened or closed, and anything you could not resolve.

---

## 4. Writing rules

These are admin-facing functional copy (AGENTS hard rule 1), so clarity beats diegesis.
- Plain, specific English with real numbers: "Email signups are blocked above 0.8 bot confidence", not "The gate seals hostile larvae".
- Sentence case titles. No ALL-CAPS, no `//`, no decorative glyphs.
- Statements say what happens, not how the code is written. Put symbol names in anchors, not in the statement.
- Do not paste secrets, keys, or member data into rules or decisions.

---

## 5. Command reference

| Command | What it does |
| :--- | :--- |
| `npm run logic:check` | Validate content, report drift, exit 1 if anything needs attention |
| `npm run logic:sync` | Rebuild `src/lib/server/logic-atlas.generated.ts` |
| `npm run logic:sync -- --accept a.b,c.d` | Re-verify those rules' anchors, then rebuild |
| `npm run logic:sync -- --accept all` | Re-verify every anchor (initial setup only) |
