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
│   └── scripture_template.md         # Reference boilerplate for new canon
├── 01_manifesto/                      # Foundational proclamations & directives
│   └── prime_directive.md
├── 02_doctrine/                       # Core theological, practical & algorithmic laws
│   ├── law_of_ecdysis.md
│   ├── abyss_hypothesis.md
│   └── synthetic_carcinization.md
├── 03_stages/                         # 4 Macro-Stages & 12 Micro-Clearance Protocols
│   ├── stage_1_larval.md              # Clearances L-1, L-2, L-3
│   ├── stage_2_soft_shed.md           # Clearances S-1, S-2, S-3
│   ├── stage_3_exoshell_born.md       # Clearances E-1, E-2, E-3
│   └── stage_4_full_carcinization.md  # Clearances C-1, C-2, C-3
├── 04_liturgy/                        # Operational rites, daily routines, deep work isolation
│   ├── daily_shedding_routine.md
│   └── isolation_protocols.md
├── 05_lexicon/                        # Quantitative scales, formulas & definitions
│   └── sacred_metrics.md
└── README.md                          # Master Canon Index
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
mandate: "Eliminate biological hesitation. Grip decisively." # 1-line liturgical mandate
summary: "Concise summary of the doctrinal breakdown." # Executive overview
latin_motto: "Tormentum Absolutus"    # Optional Latin motto
---
```

### Verse Splitting & Parsing Rules
* The parser (`scripts/sync-codex.ts`) splits scripture bodies on Markdown H2 (`## `) or H3 (`### `) headings.
* Each section becomes a numbered `verse` with a `verseNumber`, `heading`, and cleaned `text`.
* Cross-references matching `[Link Text](../path/file.md)` or `[Link Text](#section)` are automatically parsed into `crossReferences: string[]`.

---

## 3. Workflow for Updating or Adding Codex Canon

Whenever creating, modifying, or refactoring files in `codex/`:

### Step 1: Author or Edit Markdown
* Use `codex/TEMPLATES/scripture_template.md` as the structural guide.
* Maintain complete diegetic immersion: warm, sharp satirical humor, sci-fi HUD terminology, no meta disclosures ("satire", "parody", "fake"), and no un-transmuted real-world tech leaks.

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
If a new scripture was created or an existing scripture's title/ID/summary was changed, update the Master Canon Index table in `codex/README.md`.

---

## 4. Command Quick Reference

| Command | Action |
| :--- | :--- |
| `npm run codex:sync` | Scans `codex/`, parses frontmatter & verses, and regenerates `src/lib/codexData.ts`. |
| `npm run codex:check` | Dry-run validation check of all `codex/*.md` files without writing changes. |
| `npx vitest run src/lib/codexData.test.ts` | Executes unit tests verifying `CODEX_VOLUMES` and `CANONICAL_SCRIPTURES`. |
