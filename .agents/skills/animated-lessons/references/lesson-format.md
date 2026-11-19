# Lesson format

A lesson is one JSON file. `npm run anim:create` checks it before rendering and stops on problems (`--force` renders anyway, for tests only).

## Fields

| Field | What it is |
| --- | --- |
| `id` | Slug for the output folder, e.g. `codex-scr-030-daily-shedding-routine` |
| `title`, `topic` | For the ledger and review |
| `series`, `episode` | `Codex Lessons` and the next episode number |
| `format` | `short` (the only format built so far) |
| `host` | Cast id from `content/animation/cast.json` (`host-crab`); speaks any line without a `speaker` |
| `cast` | Optional `[{ "id", "at" }]` for two or more characters; `at` is a mark: `left`, `center` or `right`. Must include the host |
| `set` | Optional 3D set: `codex-study`, `reef-office` or `open-water` (pieces stay behind and beside the marks). Its art kit from `content/animation/sets/` is used automatically |
| `codex` | `{ id, title, url }` when teaching a passage |
| `hookHeadline` | Exact start of scene 1's line, under 14 words |
| `backdrop` | Optional 9:16 image, relative to the lesson file; overrides the set's painted plate |
| `scenes` | Six to ten scenes (below) |
| `caption`, `hashtags`, `firstComment`, `youtubeTitle`, `youtubeDescription`, `youtubeTags`, `ctaGoal` | Platform copy, same rules as reels |
| `outro` | Optional finished outro image; without it the host waves under "Read the full passage at moltology.org" |

## Scene fields

| Field | Values | Notes |
| --- | --- | --- |
| `line` | Spoken text | The lines joined are the soundtrack |
| `speaker` | Cast id or `narrator` | Default: the host. Each speaker uses their own voice from `cast.json`; only the speaker's mouth moves; the narrator is off screen |
| `focus` | Cast id or `all` | Who the camera frames. Default: everyone in a `two` shot, otherwise the speaker |
| `act` | `{ "<cast id>": { pose, react, look, turn } }` | Direction for other characters in this scene. The scene's own `pose`, `react`, `look` and `turn` go to the speaker (or the host when the narrator speaks). Reaction words still count words of this scene's line |
| `description` | One sentence | What the scene shows; stored as the reel's scene prompt |
| `shot` | `wide`, `two`, `medium`, `close`, `extreme`, `low`, `high` | Two fits the whole cast; wide shows the whole body; medium is the everyday talking shot; close is head and shoulders; extreme fills the frame with the face (one punchline only); low makes the host look sure of itself; high makes it look small or thoughtful |
| `move` | `cut` (default for a new idea), `glide`, `push-in`, `pull-out` | Scene 1 always opens on its shot. Glide eases there in half a second; push-in and pull-out creep across the whole scene |
| `frame` | `center`, `left`, `right` | Where the subject sits in frame; left or right leaves room for the eye to rest |
| `pose` | `rest`, `wave`, `cheer`, `flex`, `think`, `point`, `shrug`, `victory`, `ready`, `strut` | The host blends into it over about half a second |
| `react` | `[{ "kind", "word", "side" }]` | `snap` (claw snap: emphasis), `poke` (startled jump: surprise, a twist), `equip` (looks itself over: "check yourself"), `celebrate` (cheer and hop: the win). `word` is the 0-based word of this scene's line it lands on; `side` 1 or -1 picks the claw |
| `look` | `camera` (default), `other`, `wander`, `left`, `right`, `down`, `up` | `other` looks at whoever is speaking (or, for the speaker, at the nearest character). Listeners default to looking at the speaker and turn slightly toward them |
| `turn` | Degrees | Turns the whole host; small values (10 to 25) add life to a static shot |
| `spin` | Degrees per second | Slow turntable, for a "look at this" beat |
| `backdrop` | Image path | Overrides the lesson backdrop for this scene |

Word indexes count words as the voice does: hyphenated words split ("check-in" is two words) and "moltology.org" is one.

## Layout facts

- Output is 1080x1920 at 30 fps.
- The hook headline sits inside x 120-900, y 460-900 at 80 to 104px. During the spoken hook the camera aims higher so the host stands below it, then rises back as the first body word starts.
- Regular subtitles sit at y 1180 (from the reel compositor). In a medium or close shot the host's face is above them; in an extreme close-up the subtitles cross the mouth, so keep extreme shots short.
- With a cast, everyone shares one key light; a set's lamp adds a warm pool. The two shot fits marks at ±0.6 (a three-character cast fits too, but tightly).
- The host's temperament (`lively` for host-crab) drives breathing, sway, glances and blinks between cues. Talking adds the mouth, a small nod and brow lifts.

## Rendering

- On the Mac, Chrome draws the 3D on the GPU. Expect well under a second per frame.
- On Linux (the cloud) it falls back to software WebGL at about 1.5 s per frame at half size, so use `--silent --scale 0.5` and `--max-seconds` for tests there.
- `ANIM_CHROME_ARGS` passes extra Chrome flags; `COMPOSITE_CHROME_PATH` picks the Chrome binary.
