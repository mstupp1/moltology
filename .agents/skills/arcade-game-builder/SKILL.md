---
name: arcade-game-builder
description: >-
  Plan, build and ship a new game for the Moltology arcade (/arcade): a short original game that
  stars the player's own 3D character with its gear, saves scores to the shared runs table, pays
  daily-capped XP and weekly top-10 gems, plays full screen on phone and desktop, adds any new
  character moves to the shared rig, and gets painted art from Codex. Use whenever the user asks
  for a new arcade game, a change to how arcade games are built, or a game in the style of a
  well-known one.
---

# Arcade game builder

Every arcade game follows the same process. Riptide (tap-to-swim gaps), Current Runner
(seafloor runner) and Vent Hopper (bounce-up climber, tilt or hold-a-side steering) are the worked examples; copy their shape rather than inventing a new one.

## 1. Plan first, then wait for the go

Post a short plan and wait for Myles's go before writing code. Cover, in plain words:

- **How it plays**: controls (tap/click/space, plus any second action such as swipe down), what
  ends a run, how the score counts (points, metres) and how difficulty ramps.
- **Look**: original Moltology seafloor art, the member's own 3D character with its gear. When the
  user names a famous game ("like the Chrome dino game", "like Flappy Bird"), copy only the
  mechanics. Never its name, characters, art, sounds or look.
- **Screen**: full screen, nothing else on it (score, best, close X, results card).
- **Rig moves** the game needs that the shared character lacks.
- **Rewards**: what score earns XP (`minRewardScore`), anything new for the shell.
- **Art**: what Codex will paint (backdrop, textures, card art).

Live for everyone, guests included. No experiment flag unless asked.

## 2. Rules: a pure sim with tests

`src/lib/arcade/<game>-sim.ts`: plain state + `create<Game>(seed)` + `step<Game>(state, dt, input)`
returning events (`jumped`, `scored`, `died`...). No three.js, no DOM. Seeded random from
`seededRandom` so a run follows from the server's seed.

- Fixed field size in world units on every screen, so no one sees further ahead on a big monitor.
- Fixed 1/120 s steps (the component accumulates real time).
- Hit boxes a little smaller than the drawing so grazes feel fair.
- Spawn spacing must always leave room to react at top speed.
- Nothing the player can use up (a breaking platform) may be the only way on; a used-up step can
  leave a softlock where the run neither progresses nor ends (Vent Hopper keeps brittle coral off
  the climbing path).

`<game>-sim.test.ts` must include an **autopilot** that plays well and survives a long run on many
seeds (proves every run is beatable), plus checks that every autopilot score passes
`isPlausibleScore` for its time.

## 3. Register the game

`src/lib/arcade.ts`: add the id to `ARCADE_GAME_IDS` and an entry in `ARCADE_GAMES`:

- `minSecondsPerPoint` and `leadInSeconds`: the server refuses scores faster than these. Work them
  out from the sim's top speed and write the reasoning in a comment.
- `maxScore` (the API caps at 99999), `minRewardScore` (XP and weekly gems need at least this),
  `unit` if the score has one ("m").
- `path: '/arcade/<id>'`.

No database change: `arcade_runs.game` is text. The API schema reads `ARCADE_GAME_IDS`.

## 4. Picture: a scene that reads the sim

`src/lib/arcade/<game>-scene.ts` exports `create<Game>Scene(canvas, options)` returning
`setLook`, `draw(state, dt, time)`, event hooks (`jump`, `crash`...), `resize`, `dispose`.

- Shared pieces live in `src/lib/arcade/scene-kit.ts` (light shafts, bubbles, faceted rocks with
  per-face colour, far ridges). Add new reusable pieces there.
- Character: `buildCharacter({ ...look, pose: 'rest' })`, scaled to a fixed height, baked with
  `built.bake(renderer)`; on low quality wrap in `withLoftDetail(0.8, ...)`.
- Camera fits the whole field: wide screens fit the height (dim what lies past the field in the
  component), tall phones fit the width and show more water.
- Painted art loads in the background from the bucket; the scene must look finished without it.
- Soft contact shadows under anything on the floor help heights read.
- `quality: 'low'` on touch devices or 4 cores and fewer; respect `reducedMotion`.
- Free every geometry, material and texture in `dispose`.

## 5. Character moves go on the shared rig

Never animate the character inside the game file. Add moves to `Character3D` in
`src/lib/avatar3d/character.ts` (and pass-throughs on the Stage in `stage.ts`) so content videos
and other pages can use them. Existing moves:

- `setSwim(on)` + `stroke()`: swimming (Riptide).
- `setRun(on, pace)`, `setDuck(on)`, `leap()`, `land()`, `tumble()`: running, ducking, jumping,
  crashing (Current Runner).
- `bounce(strength)`, `setFall(on)`: bouncing off pads (2+ for a big launch) and flailing in a fall
  (Vent Hopper).
- `react(kind)`: poke, snap, equip, celebrate. `setPose(pose)` for held poses.

A move is an overlay that eases in and out over whatever pose is held, works for crabs and
lobsters, and is driven by `update(dt, time, idle)`. Keep the game moving the character root
(position, knock-back tilt); the rig only poses the body.

## 6. The component and page

`src/components/arcade/<Game>Game.tsx` uses the shared shell in `ArcadeShell.tsx`:

- `useArcadeRuns(gameId, { signedIn, isGuest, onSeed })` asks the server for each run and saves
  the result (guest best stays in this browser).
- `<ArcadeFrame>` is the full-screen portal (z-[100050]) with best, live score, close X, ready
  text, pause and results card, plus sign-up for guests. Pass the game's canvas ref, pointer
  handlers and any extra layers (dimmed field edges).
- `usePauseWhenHidden` (tab hidden, window blur, Escape/P), `keyBelongsToPage`, `RESULTS_DELAY_MS`.
- Game feel every game gets (copy any of the three):
  - Sounds from `src/lib/arcade/sound.ts` (`playArcadeSound`, made in code, no files) for each
    action, point, milestone, crash and new best; `arcadeBuzz` for crashes and hits. The frame's
    mute button covers both.
  - On a crash: freeze the loop for `HIT_STOP_MS`, bump `crashPulse` (screen flash) and play the
    crash sound.
  - The player's best in the world: the scene takes `setBest(best)` and draws `createBestMarker`
    from `scene-kit.ts`; the component bumps `bestPulse` ("New best" tag) the first time the score
    passes it in a run.
  - Pass `onPause` (pause button) and, if the player sits low on a phone, `resultsAt="high"` so the
    results card does not cover the crash.
  - On touch screens a second action needs its own place to press (Current Runner: hold the left
    side to duck), not a gesture that starts with the first action.

Add `src/routes/_hud/arcade.<id>.tsx` (copy riptide's), a `<Game>Page` in `ArcadePages.tsx`, the
id in `GAME_ORDER` (newest first, it gets the "New game" eyebrow) and its card art key in
`CARD_ART`, and keywords in `src/lib/command-catalog.ts`. Run `npx vite build` once so the route
tree regenerates.

## 7. Art from Codex on Myles's Mac

All painted images go to Codex on Myles's Mac, latest Luna model, low effort, started through a
Remote Control session in `~/Development/moltology` (the repo is only used for
`scripts/upload-asset.ts` and `.env`; nothing is committed there). One `codex exec` per image:

```
codex exec -m gpt-6-luna -c model_reasoning_effort="low" -s workspace-write --skip-git-repo-check "<prompt> Save the result as a PNG at ./raw/<name>.png" </dev/null
```

Usual set: a wide tileable backdrop (`images/arcade/v1/<id>-backdrop.jpg`), 4:3 card art with the
left-middle third open (`images/arcade/v1/<id>-card.jpg`), any tileable textures
(`textures/arcade/v1/<name>.webp`, 1024 square). Prompts share one style line: painterly stylized
3D game art, the deep ocean palette, no text, no characters, no crabs or lobsters, nothing from the
game it is modelled on, and nothing in a backdrop that could pass for a hazard (a painted jellyfish
in a game with jellyfish obstacles). Ask for a contact sheet back and look at it in the game before
wiring keys in. To replace an image, upload it under a new key (`-2`) rather than overwriting a live
one; small fixes (painting out a detail) can be done in the cloud with PIL and handed to the Mac
for upload.

## 8. Check, screenshot, ship

- `npm run typecheck`, `npm run ui:check`, tests for the sim, `src/lib/arcade.test.ts`, the
  character tests and `src/lib/server/arcade.test.ts`.
- Play it as a guest with `npm run dev`: desktop 1440x900, phone portrait 390x844 and phone
  landscape 844x390. In dev the component exposes its state on `window.__arcadeState` so a
  Playwright script can place obstacles for shots (ready, mid-move, crash, results).
  Launch Chromium with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.
- Open the PR with the screenshots and ask for 🚀 to merge.
