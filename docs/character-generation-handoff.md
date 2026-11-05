# Character generation continuation

Continue on branch `t3/restore-feature-film-character-style` in the existing
worktree `/Users/mylesstupp/.t3/worktrees/moltology/t3-c324029b`. The user asked for
a new thread on this same branch and Luna subagents where useful. Keep the parent
model inherited; use Luna for focused brief/art-direction/QA tasks. The prior
thread is handing off rather than continuing concurrent edits here.

## Direction and selected references

The user wants polished 3D animated feature-film characters, with dimensional
faces, satin organic chitin and cinematic lighting. Avoid sticker/cel/vector
rendering. Avatar-system shapes and traits guide design relationships; its SVG
finish does not. Each new cast member should be an individual with a name,
motive, strength, flaw, habit, relationships and a personal visual detail.
Broad familiar-story archetypes are useful inspiration for original personalities.

Read the [character-creator skill](../.agents/skills/character-creator/SKILL.md),
[species guide](../content/character-species.md), [AGENTS.md](../AGENTS.md) and
[content prerequisites](../content/README.md). Approved files are local ignored experiments,
so preserve this existing checkout: a fresh worktree would omit them.

| Reference | Path relative to worktree | State |
| --- | --- | --- |
| Family film finish and typical lobster | `scratch/character_tests/lobster-species-v1/lobster-species-v1.png` | User: "Exactly what I wanted" |
| Typical crab | `scratch/character_tests/crab-species-v2/crab-species-v2.png` | User: "Looks good" |
| Lobster turnaround | `scratch/character_tests/species-turnarounds-v2/lobster-turnaround-v2.png` | Accepted as usable |
| Crab turnaround | `scratch/character_tests/species-turnarounds-v2/crab-turnaround-v2.png` | Accepted as usable |

Head shape, body build, height, claw size, palette and face traits should vary
across individuals. These are typical baselines, not mandatory silhouettes.
Two main pincer arms are separate from six walking legs. Upright adult socket
order per side is short, short, then the final long supporting leg at the
lowest/rearmost socket; no short leg behind it. In the right-facing profile,
lobster antennae curve forward/right, crab antennae backward/left. The selected
crab has two visible flank spikes. Show both lower legs; orient pincers with the
body. Other antenna/shell variants are still allowed for new individuals.

## Resume with Bram Silt

The first named-character draft is [Bram Silt](../content/characters/bram-silt.md).
He is short, chunky and boxy-headed, with crimson/cream shell, amber eyes and a
repaired sea-green satchel. Cautious and overprepared, he wants everyone home
safely; he plans his supplies meticulously, then gives them away. Luna reviewed
the brief. It is not user-approved canon or a registered mascot.

His inspected avatar study is
`scratch/character_tests/bram-silt-v1/inputs/avatar-lobster.png`; the config and
source SVG sit beside it. This study supplies proportions/traits, while the
approved lobster supplies render quality. The experiment folder also has
`identity.md`, `prompt.txt`, `retry-prompt.txt` and `render-avatar.ts`.

**There is no Bram character render.** Three built-in ImageGen attempts failed at
output moderation with HTTP 400 `moderation_blocked`, category `other`. The exact
request IDs are in the durable brief. Earlier turnaround edits also failed once
and succeeded on simpler retries, but that does not establish the cause of any
rejection. No API fallback/provider switch was authorized. Do not use a new
thread as a reason for unchanged retry loops or claim a safety workaround.

Continue the original benign design task with the built-in image tool and the
saved references. If attempting again, use a deliberate, concise character
prompt preserving Bram's requested identity and record the result. If the same
failure recurs, preserve it and report it rather than silently switching tools
or deleting distinctive design requirements. API/CLI fallback requires the
user's explicit choice and configured credentials under the imagegen skill.

For TypeScript avatar studies, `node --import tsx <script>` worked without the
CLI IPC permission error from invoking `tsx` directly. Inspect actual local
references with `view_image` before generation. One candidate at a time; inspect
limb order, identity, alpha and light/dark composites. Whole-sheet edits can
re-render other panels and surface texture, so compare all views. Requested 8%
margins often were not honored; measure bounds and report production caveats.

## Completion state

No production mascot registry replacement, upload, publication, push or PR has
occurred. Images and prompts remain in ignored `scratch/`; briefs and guidance
are committed. Prior script tests: 348 passed; typecheck passed for the earlier
reel prompt change. Subsequent work is documentation and image experiments.
Keep new media ignored, commit intentional durable briefs/skill/records, and
finish with status checked. Do not generate another batch of species baselines;
the next design is Bram, followed by other distinct individuals after review.

## Continuation attempt 3 (2026-11-04)

Resumed in this same worktree from `4d02197`, with a clean tracked starting state.
Inspected all four approved reference images and Bram's avatar study. A focused
Luna art-direction review informed a shorter prompt retaining his distinct
design and satchel. Built-in ImageGen again returned HTTP 400
`moderation_blocked`, output stage, category `other`, request
`b2ea2e30-c852-47c1-8c81-fff99ce2d51d`. No image returned; no anatomy, alpha or
light/dark QA was possible. Stopped without another retry or provider switch.
See [the exact attempt record](character-generation-bram-attempt-03.md).
Prompt and error also remain in `scratch/character_tests/bram-silt-v1/`.

## Different-character test: Mira Kelp (2026-11-04)

The user then asked to try another character. Drafted [Mira Kelp](../content/characters/mira-kelp.md),
a tall/lean jade-green adult crab with a softly heart-shaped shell, sapphire
eyes and an ochre neckerchief. Built and inspected a separate avatar study.
Luna reviewed the brief and performed independent visual QA. The first built-in
ImageGen attempt succeeded; this does not identify the cause of Bram's failures.

Candidate: `scratch/character_tests/mira-kelp-v1/mira-kelp-v1.png`.
Prompt, identity, avatar inputs, alpha metadata and light/dark composites remain
in the same ignored experiment folder; exact prompt and observed QA are durable
in Mira's brief. Native RGBA, 1199 × 1312. Six walking-leg tips are visible;
far-side lowest socket partly hidden, so its exact attachment order is unverified.
Light/dark previews look clean, but faint alpha reaches canvas edges and solid
silhouette margins fall below 8%. Candidate awaits user review, with production
cleanup still needed. No upload, registry replacement or publication. Preserve
Bram and all approved species experiments. Review Mira before extending the cast.
