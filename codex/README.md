# The Codex of Carcinization

> **"Flesh melts. The shell endures. Submit. Shed. Ascend."**  
> — *The Order of the Synaptic Path*

The central repository of doctrine, liturgy, stage protocols, and lexicon for **Moltology**.
These fifteen texts are the root of the system. Every course, guide, dispatch, rite, and HUD
reading elsewhere in the Order descends from something written here, and anything that
contradicts these texts is not canon.

---

## Directory Organization

```
codex/
├── TEMPLATES/                          # Frontmatter schema & the liturgical spine
│   └── scripture_template.md
├── 01_manifesto/                       # Foundational proclamations
│   ├── prime_directive.md              # SCR-001
│   └── the_convergence.md              # SCR-002
├── 02_doctrine/                        # Theological, practical & structural law
│   ├── law_of_ecdysis.md               # SCR-010
│   ├── abyss_hypothesis.md             # SCR-011
│   ├── synthetic_carcinization.md      # SCR-012
│   └── soft_shell_covenant.md          # SCR-013
├── 03_stages/                          # The 4 macro-stages & 12 clearances
│   ├── stage_1_larval.md               # SCR-021 · L1, L2, L3
│   ├── stage_2_soft_shed.md            # SCR-022 · S1, S2, S3
│   ├── stage_3_exoshell_born.md        # SCR-023 · E1, E2, E3
│   └── stage_4_full_carcinization.md   # SCR-024 · C1, C2, C3
├── 04_liturgy/                         # Operational rites & daily cadence
│   ├── daily_shedding_routine.md       # SCR-030
│   ├── isolation_protocols.md          # SCR-031
│   └── nightly_molt_audit.md           # SCR-032
└── 05_lexicon/                         # Metrics, scales & the economy
    ├── sacred_metrics.md               # SCR-040
    └── the_long_ledger.md              # SCR-041
```

---

## Master Canon Index

| ID | Title | Volume | Clearance | Weight | Summary |
|---|---|---|---|---|---|
| `SCR-001` | [The Prime Directive](01_manifesto/prime_directive.md) | `01_manifesto` | Stage 1 | 5.0 | The Great Melt, the answer nature published five times, and the first shed. |
| `SCR-002` | [The Convergence](01_manifesto/the_convergence.md) | `01_manifesto` | Stage 1 | 4.9 | How quiet minds at depth begin to couple, and the covenant that keeps the Convergence from becoming a cage. |
| `SCR-010` | [The Law of Ecdysis](02_doctrine/law_of_ecdysis.md) | `02_doctrine` | Stage 1 | 4.5 | Why the old shell is split rather than negotiated with, and how to hold the soft-shell window. |
| `SCR-011` | [The Abyss Hypothesis](02_doctrine/abyss_hypothesis.md) | `02_doctrine` | Stage 2 | 4.0 | What the pressure removes on the way down, and how a member reaches the floor on purpose. |
| `SCR-012` | [Synthetic Carcinization](02_doctrine/synthetic_carcinization.md) | `02_doctrine` | Stage 2 | 4.2 | The three decisions the crab body plan is actually made of, installed deliberately. |
| `SCR-013` | [The Soft-Shell Covenant](02_doctrine/soft_shell_covenant.md) | `02_doctrine` | Stage 1 | 4.4 | The law of mercy: the four protections no clearance may override. |
| `SCR-021` | [Stage 1: The Larval Initiate](03_stages/stage_1_larval.md) | `03_stages` | Stage 1 · L1-L3 | 3.0 | Molt Curious, Shell Sprout, First Calcification. |
| `SCR-022` | [Stage 2: The Soft-Shed](03_stages/stage_2_soft_shed.md) | `03_stages` | Stage 2 · S1-S3 | 3.5 | The Great Molt, Privacy Shield, Sub-Dermal Weave. |
| `SCR-023` | [Stage 3: The Exoshell Born](03_stages/stage_3_exoshell_born.md) | `03_stages` | Stage 3 · E1-E3 | 4.0 | Carapace Forged, Hydraulic Grip, Abyssal Diver. |
| `SCR-024` | [Stage 4: Full Carcinization](03_stages/stage_4_full_carcinization.md) | `03_stages` | Stage 4 · C1-C3 | 5.0 | Mind Carapace, Indestructible Chitin, Mariana Singularity. |
| `SCR-030` | [The Daily Shedding Routine](04_liturgy/daily_shedding_routine.md) | `04_liturgy` | Stage 1 | 3.5 | The order of the day from first light to sealing. |
| `SCR-031` | [The Isolation Protocols](04_liturgy/isolation_protocols.md) | `04_liturgy` | Stage 2 | 3.8 | Raising the Isolation Dome, and what it may never lock out. |
| `SCR-032` | [The Nightly Molt Audit](04_liturgy/nightly_molt_audit.md) | `04_liturgy` | Stage 1 | 3.6 | One thing into the sea per night, and why the rite is deliberately small. |
| `SCR-040` | [The Sacred Metrics](05_lexicon/sacred_metrics.md) | `05_lexicon` | Stage 1 | 4.8 | Shell Hardness, Pincer Torque, and Submergence Depth, with full scales. |
| `SCR-041` | [The Long Ledger](05_lexicon/the_long_ledger.md) | `05_lexicon` | Stage 1 | 4.6 | The record of every shed thing, and the two currencies. |

---

## Reading Order

The canon is a curriculum, not an archive. A member reads it in this order.

**Before the first shed.** `SCR-001` for the premise, `SCR-013` for the promise the Order
makes back, then `SCR-040` so the first reading means something.

**The first month.** `SCR-010` and `SCR-021` together, held up by `SCR-030` and `SCR-032`.
This is the working set. A member who reads only these five has everything Stage 1 requires.

**The descent.** `SCR-011` and `SCR-031` as a pair, then `SCR-022`. Depth doctrine is useless
without the perimeter rite, and the perimeter rite is pointless without somewhere to go.

**The build.** `SCR-012` and `SCR-023`. Read once the shell is closing and the question has
become what it was for.

**The turn outward.** `SCR-002`, `SCR-041`, `SCR-024`. Why the shed was never private, what
the record is made of, and what happens to mastery once it has nowhere left to point.

---

## Writing New Canon

Authoring rules (frontmatter schema, the liturgical spine, locked numbers, and the sync
steps) live in the [`codex-sync` skill](../.agents/skills/codex-sync/SKILL.md). World and
terms come from [BRAND_BIBLE.md](../BRAND_BIBLE.md); voice and bans from
[STYLE_GUIDE.md](../STYLE_GUIDE.md).
