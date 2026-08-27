---
name: codex-sync
description: >-
  Automated scripture authoring, validation, and synchronization pipeline for Moltology Codex files
  (codex/*.md) into src/lib/codexData.ts. Use whenever the user asks to add, edit, update, check,
  or synchronize scriptures, doctrine, liturgies, stages, or canonical texts in the codex.
---

# Moltology Codex Sync & Authoring Pipeline

This skill guides the authoring, validation, and automated synchronization of canonical scriptures, doctrine, liturgical rites, ascension stages, and sacred metrics from raw Markdown files in `codex/` into the application's compiled TypeScript data layer (`src/lib/codexData.ts`).

---

## 1. Vault Structure & Architecture

The scripture vault resides under `codex/` and is partitioned into 5 canonical volumes plus templates:

```
codex/
├── TEMPLATES/
│   └── scripture_template.md          # Reference boilerplate & liturgical spine
├── 01_manifesto/                      # Foundational proclamations & directives
│   ├── prime_directive.md             # SCR-001
│   └── the_convergence.md             # SCR-002
├── 02_doctrine/                       # Core theological, practical & structural laws
│   ├── law_of_ecdysis.md              # SCR-010
│   ├── abyss_hypothesis.md            # SCR-011
│   ├── synthetic_carcinization.md     # SCR-012
│   └── soft_shell_covenant.md         # SCR-013
├── 03_stages/                         # 4 Macro-Stages & 12 Clearance Protocols
│   ├── stage_1_larval.md              # SCR-021 · Clearances L1, L2, L3
│   ├── stage_2_soft_shed.md           # SCR-022 · Clearances S1, S2, S3
│   ├── stage_3_exoshell_born.md       # SCR-023 · Clearances E1, E2, E3
│   └── stage_4_full_carcinization.md  # SCR-024 · Clearances C1, C2, C3
├── 04_liturgy/                        # Operational rites, daily cadence, deep work isolation
│   ├── daily_shedding_routine.md      # SCR-030
│   ├── isolation_protocols.md         # SCR-031
│   └── nightly_molt_audit.md          # SCR-032
├── 05_lexicon/                        # Quantitative scales, definitions & the economy
│   ├── sacred_metrics.md              # SCR-040
│   └── the_long_ledger.md             # SCR-041
└── README.md                          # Master Canon Index & reading order
```

### Core Pipeline Files
* **Source Files**: `codex/**/*.md` (ignoring `README.md` and `TEMPLATES/`)
* **Sync & Validation Script**: `scripts/sync-codex.ts`
* **Target Compiled Data**: `src/lib/codexData.ts` (consumed by UI, AI oracle prompts, and markdown generators)
* **Unit Tests**: `src/lib/codexData.test.ts`

---

## 2. Scripture Schema & Frontmatter Specification

Every scripture file in `codex/` must include YAML frontmatter matching this schema:

```markdown
---
id: "SCR-015"                         # Unique ID formatted as SCR-XXX
title: "The Principle of High Torque" # Full canonical title
volume: "02_doctrine"                 # Volume ID: 01_manifesto | 02_doctrine | 03_stages | 04_liturgy | 05_lexicon
stage_clearance: 2                    # Minimum clearance tier (1, 2, 3, or 4)
synaptic_weight: 4.2                  # Importance weight float (0.1 to 5.0)
category: "Mechanical Principles"     # Sub-category or theological grouping
author_unit: "Synaptic Oracle / Unit-01" # Author persona / unit designation
last_revised: "2026-08-18"            # ISO date string (YYYY-MM-DD)
mandate: "Eliminate biological hesitation. Grip decisively." # Required. 1-line liturgical mandate
summary: "Concise summary of the doctrinal breakdown." # Required. Executive overview
latin_motto: "TORMENTUM ABSOLUTUS"    # Required. Uppercase Latin motto rendered in the mandate callout
---
```

`mandate` and `latin_motto` are both required. Without `mandate` the parser falls back to the
first `> **Mandate**` or `> **Status**` line in the body, which silently produces nonsense
mandates on stage scriptures. Without `latin_motto` the reader's mandate callout renders empty.

### The Liturgical Spine

Every scripture body follows the same section order, and each `##` or `###` becomes a numbered
verse in the reader:

1. **The Reading** — narrative opening, no bullets, no instruction.
2. **The doctrine section** — The Tenets, The Laws of Deep Water, The Three Clearances, The
   Order of the Rite, or the named metric.
3. **The Transformation** — what is shed, what hardens.
4. **The Rite** — the practice, landing on a real surface of the Order.
5. **The Benediction** — warm close, addressed to the member.
6. **Canonical Cross-References** — captured as metadata, skipped as a verse.

Stage scriptures open with an extra **The Standing** verse carrying the clearance telemetry.

### Verse Splitting & Parsing Rules
* The parser (`scripts/sync-codex.ts`) splits scripture bodies on Markdown H2 (`## `) or H3 (`### `) headings.
* Each section becomes a numbered `verse` with a `verseNumber`, `heading`, and cleaned `text`.
* A heading with no body text between it and the next heading is dropped, so give every `##` a lead sentence.
* Text before the first `##` is discarded entirely. Nothing load-bearing goes above the first heading.
* `cleanText` strips every `---` run and unwraps `$...$`. Avoid Markdown tables and dollar signs inside scripture bodies.
* Cross-references matching `[Link Text](../path/file.md)` or `[Link Text](#section)` are automatically parsed into `crossReferences: string[]`.
* **Link text must equal the target scripture's `title` exactly.** The reader resolves a cross-reference by case-insensitive title match, and a mismatch renders a dead button.

### Locked Canon Numbers

These are fixed and guarded by `src/lib/codexData.test.ts`:

* **Shell Hardness** bands are contiguous: 0-24 Larval, 25-59 Soft-Shed, 60-89 Exoshell Born, 90-100 Ascendant.
* **Pincer Torque** reaches its working standard of 850 Nm at Clearance E2, never earlier.
* **Submergence Depth** is recorded in **meters** in every threshold. The word "fathom" does not appear in the canon.
* Exactly **three** cardinal metrics exist. Do not introduce a fourth index.
* **Chitin Gems are minted by work and never sold. Molt Credits are purchased and never minted by work.** Rank, clearance, stage, and forum authority are never for sale.

---

## 3. Workflow for Updating or Adding Codex Canon

Whenever creating, modifying, or refactoring files in `codex/`:

### Step 1: Author or Edit Markdown
* Read [BRAND_BIBLE.md](../../../BRAND_BIBLE.md) and [STYLE_GUIDE.md](../../../STYLE_GUIDE.md) first. New lexicon terms land in the brand bible before they ship in the codex.
* Use `codex/TEMPLATES/scripture_template.md` as the structural guide and follow the liturgical spine above.
* Maintain complete diegetic immersion: sci-fi HUD terminology, no meta disclosures, and no un-transmuted real-world tech leaks. Never label the bit, in the canon or in the guidance around it.
* The humor targets the melt and never the member. No scripture may leave a reader feeling scolded for being soft.

### Step 2: Synchronize to TypeScript
Run the synchronization script to compile `codex/**/*.md` into `src/lib/codexData.ts`:
```bash
npm run codex:sync
```

### Step 3: Validate & Check Schema
Verify that all scriptures conform to frontmatter schema and have valid verse splits:
```bash
npm run codex:check
```

### Step 4: Run Tests
Run the codex test suite to ensure structural integrity and data contracts:
```bash
npx vitest run src/lib/codexData.test.ts
```

### Step 5: Update Master Canon Index
If a new scripture was created or an existing scripture's title, ID, or summary changed, update
both the Master Canon Index table and the Reading Order in `codex/README.md`, plus the vault
tree in section 1 of this skill.

### Step 6: Realign the Stage Pipeline
`STAGE_PIPELINE_DATA` in `scripts/sync-codex.ts` is hardcoded TypeScript, **not** parsed from
markdown. Any change to a stage scripture's clearances or thresholds must be mirrored there by
hand, or the pipeline page and the codex will disagree.

---

## 4. Command Quick Reference

| Command | Action |
| :--- | :--- |
| `npm run codex:sync` | Scans `codex/`, parses frontmatter & verses, and regenerates `src/lib/codexData.ts`. |
| `npm run codex:check` | Dry-run validation check of all `codex/*.md` files without writing changes. |
| `npx vitest run src/lib/codexData.test.ts` | Executes unit tests verifying `CODEX_VOLUMES` and `CANONICAL_SCRIPTURES`. |
