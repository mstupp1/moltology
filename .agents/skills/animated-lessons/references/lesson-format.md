# Lesson format

A lesson is one JSON file. `npm run anim:create` checks it before rendering and stops on problems (`--force` renders anyway, for tests only).

## Fields

| Field | What it is |
| --- | --- |
| `id` | Slug for the output folder, e.g. `codex-scr-030-daily-shedding-routine` |
| `title`, `topic` | For the ledger and review |
| `series`, `episode` | `Codex Lessons` and the next episode number |
| `format` | `short` (the only format built so far) |
| `host` | Cast key, first name or alias from `content/characters/cast.json` (`juno`); speaks any line without a `speaker` |
| `cast` | Optional `[{ "id", "at" }]` for two or more characters; `at` is a mark: `left`, `center` or `right`. Must include the host |
| `acting` | Optional `auto` (default), `calm` or `none`: how much the cast acts on their own while talking and listening (see [Acting](#acting)) |
| `set` | Optional 3D set: `codex-study`, `reef-office`, `open-water` or `podcast-studio` (pieces stay behind and beside the marks, except the podcast desk, which stands in front of the cast on purpose). Its art kit from `content/animation/sets/` is used automatically |
| `tag` | Optional small label on every scene, top left, at most 32 characters: `"Molt Pod · Ep. 3"` for show-style series |
| `codex` | `{ id, title, url }` when teaching a passage |
| `hookHeadline` | Scene 1's whole line, under 14 words |
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
| `act` | `{ "<cast id>": { pose, react, gesture, acting, look, turn } }` | Direction for other characters in this scene. The scene's own `pose`, `react`, `gesture`, `acting`, `look` and `turn` go to the speaker (or the host when the narrator speaks). Reaction and gesture words still count words of this scene's line |
| `description` | One sentence | What the scene shows; stored as the reel's scene prompt |
| `shot` | `wide`, `two`, `medium`, `close`, `extreme`, `low`, `high` | Two fits the whole cast; wide shows the whole body; medium is the everyday talking shot; close is head and shoulders; extreme fills the frame with the face (one punchline only); low makes the host look sure of itself; high makes it look small or thoughtful |
| `move` | `cut` (default for a new idea), `glide`, `push-in`, `pull-out` | Scene 1 always opens on its shot. Glide eases there in half a second; push-in and pull-out creep across the whole scene. On a two-shot, a pull-out opens on the plain two-shot and eases wider, so outer claws never start cropped |
| `frame` | `center`, `left`, `right` | Where the subject sits in frame; left or right leaves room for the eye to rest |
| `pose` | `rest`, `wave`, `cheer`, `flex`, `think`, `point`, `shrug`, `victory`, `ready`, `strut` | The host blends into it over about half a second. `think` holds a claw over the mouth, so it is for listeners only (the check rejects it on a speaker) |
| `react` | `[{ "kind", "word", "side" }]` | `snap` (claw snap: emphasis), `poke` (startled jump: surprise, a twist), `equip` (looks itself over: "check yourself"), `celebrate` (cheer and hop: the win). `word` is the 0-based word of this scene's line it lands on; `side` 1 or -1 picks the claw |
| `gesture` | `[{ "kind", "word", "side" }]` | Hand-placed talking gestures (below), each landing on a word. Any here replace the automatic acting for that character in this scene |
| `acting` | `auto`, `calm`, `none` | Overrides the lesson's `acting` for this character in this scene. `none` for a frozen beat (a stunned pause), `calm` for a quiet line |
| `look` | `camera` (default), `other`, `wander`, `left`, `right`, `down`, `up` | `other` looks at whoever is speaking (or, for the speaker, at the nearest character). Listeners default to looking at the speaker and turn slightly toward them |
| `turn` | Degrees | Turns the whole host; small values (10 to 25) add life to a static shot |
| `spin` | Degrees per second | Slow turntable, for a "look at this" beat |
| `backdrop` | Image path | Overrides the lesson backdrop for this scene |

Word indexes count words as the voice does: hyphenated words split ("check-in" is two words) and "moltology.org" is one.

## Acting

Characters act on their own unless told not to, so nobody stands frozen through a line. The automatic pass (`actingCues` in `scripts/lib/character-animation/lesson.ts`) works from the voice's word timings, and the same lesson always acts the same way:

- **The speaker** gestures on stressed words (long words, numbers, anything said with "!"), at most one every 1.25 seconds (2.4 when `calm`): a `beat` of a claw, `open` (both claws out: "here is the whole idea"), `offer` (a claw held out to the other character), or a `shift` of weight. A sentence ending in "?" gets a head `tilt`. Close shots use smaller gestures, mostly head moves.
- **Listeners** `nod` at the end of most sentences, `tilt` at a question and now and then shift their weight.
- Nothing automatic lands within about a second of a hand-written reaction, gesture or pose change, so direction always wins.

Hand-placed `gesture` kinds: `beat` (emphasis on a word), `open` (a big idea or a list), `offer` (giving the other character something: an answer, a turn to speak), `tilt` (a question, doubt), `nod` (agreeing), `shift` (a change of thought). `side` 1 is the character's own left claw (the viewer's right when it faces the camera). Use a reaction instead for anything bigger than a gesture (surprise, a win).

Pose changes roll out from the body to the claws (shoulder first, pincers last), and every gesture winds up slightly the other way before it hits, which is what makes the motion read as drawn rather than stiff.

## Lip sync

Speaking characters use the classic animator's mouth chart (Preston Blair, the Hanna-Barbera set) in the nine-letter form Rhubarb Lip Sync writes, drawn in the character's own style (`src/lib/avatar3d/mouth-shapes.ts`): X rest (the character's own drawn mouth), A lips pressed (M, B, P), B teeth together (most consonants), C open (EH), D wide open (AA), E round (OH), F pucker (OO, W), G top teeth on the lip (F, V), H tongue up (L).

Shapes come from [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync) (free, offline), which listens to each voice take with its script. The renderer fetches it once into `tmp/tools/` (or set `RHUBARB_PATH`) and caches its answer next to each take (`voice/take-*.mouth-*.json`). Without it, and on silent renders, shapes are guessed from the spelling of each word over its timing. The render log says which was used (`👄 Mouth shapes from ...`).

The shapes then get an animator's pass, so each frame reads at phone size and speed:

- **Lead.** The mouth runs 2 frames ahead of the voice (`LEAD_FRAMES` in `scripts/lib/character-animation/lipsync.ts`). A mouth exactly on the sound reads late on screen.
- **Key shapes always show, and only where the script has them.** Lips meeting (A), top teeth on the lip (G) and the pucker (F) get at least one frame, two when the sounds around them can spare it, however short the sound. Rhubarb sometimes hears a close or an F that isn't in the words (a hard TH, a breath); an A or G with no word spelled with M/B/P or F/V/PH around it becomes teeth together (B) instead of twitching. Any other shape that would flash for a single frame between two ordinary ones holds the shape before instead. A one-frame opening between two closes ("mama") stays.
- **Pressed lips are a thin dark line**, not the character's resting smile, so a close mid-word never reads as a quick grin.
- **Size follows stress.** Each word gets a strength from its loudness against the take's typical word and from the word itself (little words light, long words and numbers heavier, `!` stronger). Stressed words open up to about a third bigger, little words smaller. The strongest words, no closer than about two thirds of a second apart, also get an accent: the head dips a touch and the brows lift on the loudest frame.
- **In-betweens only on big changes.** Wide open to shut, or a pucker to a grin, gets one halfway frame when the new shape holds long enough to land after it. Small changes snap. A lip close lands fully shut on its first frame.
- **Pauses.** A gap of up to about a third of a second inside a line relaxes the lips slightly apart. At the end of a line the last shape holds 2 frames, then eases shut over 3.
- **The face joins in.** The open mouth hangs like a jaw (its bottom edge travels more than its top), and wide-open vowels narrow the eyes a little.

All of this is drawn from the per-frame tracks in the timeline (`mouthBy`, `emphasisBy`, `accentBy`); `speechMouthTrack` in `src/lib/avatar3d/mouth-shapes.ts` turns them into the drawn mouth.

### Mouth check

`npm run anim:create -- --lesson <file> --mouth-check` renders the lesson again as face close-ups on whoever is speaking, with each speaker's current shape letter (and the sounds it stands for) at the top and the voice's waveform along the bottom (labels are drawn as images, so any ffmpeg build works), to `<out>/mouth-check/mouth-check.mp4`. Letters are shown on the frames they are drawn, so they sit 2 frames ahead of their sound in the waveform. Use it when a line looks off, or after changing anything in the lip sync. It reuses the cached voice takes. Run it on the Mac (about as long as the main render); in the cloud add `--silent --scale 0.5 --max-seconds 5`.

## Clipping check

Before any frame is drawn, `anim:create` rehearses the whole timeline in Node (a couple of seconds) and checks that no claw, arm or leg passes through its own body or through another character (`src/lib/avatar3d/collide.ts`). Each solid part is stood in for by spheres sitting inside it, so a hit means the parts really cross, not that they touch.

- During the animation itself, a claw that ends up inside something is swung out at the shoulder, and that push carries over from frame to frame and lets go slowly, so touching arms slide past each other instead of twitching.
- Automatic gestures that cause a crossing are halved, then dropped, until the rehearsal is clean (`🦾 Toned down N gestures`).
- A crossing left over comes from hand-written direction: a pose, a reaction or a turn. The run stops and lists each moment, for example `11.10s–11.33s: juno's clawR through kit's forearmL, 56% deep`. Fix it in the lesson (a different pose or reaction side for that scene, a turn away, a `close` shot on one character, or marks further apart), then run again. `--allow-clipping` renders anyway, for tests only.
- `npm run anim:create -- --lesson <file> --check` (add `--silent` for no voice) runs only the voice, plan and rehearsal: use it after every direction change. The report is in `clipping.json` in the output folder.

## Layout facts

- Output is 1080x1920 at 30 fps.
- The hook headline sits inside x 120-900, y 460-900 at 80 to 104px. The opening shot aims higher so the cast stands below the headline; that framing holds for all of scene 1 and changes on the cut to scene 2 (scene 2 always cuts in), so the frame never slides. Keep scene 1 short after the hook.
- Regular subtitles sit at y 1180 (from the reel compositor). In a medium or close shot the host's face is above them; in an extreme close-up the subtitles cross the mouth, so keep extreme shots short.
- With a cast, everyone shares one key light; a set's lamp adds a warm pool. Marks stand at ±1.05 so two characters' claws have room to gesture without crowding each other; the two shot (a little wider than before) fits them, and a three-character cast fits too, but tightly.
- On a cut, a character whose pose changes opens the new shot already in it (no blend), so a limb never sweeps across the frame or through a neighbour at the cut. A glide still blends.
- The host's temperament (`lively` for Juno) drives breathing, sway, glances and blinks between cues. Talking adds the mouth shapes, a slow drift of the head, and a head dip with a brow lift on stressed words (see [Lip sync](#lip-sync)); the acting pass adds the gestures.

## Rendering

- On the Mac, Chrome draws the 3D on the GPU. Expect well under a second per frame.
- On Linux (the cloud) it falls back to software WebGL at about 1.5 s per frame at half size, so use `--silent --scale 0.5` and `--max-seconds` for tests there.
- `ANIM_CHROME_ARGS` passes extra Chrome flags; `COMPOSITE_CHROME_PATH` picks the Chrome binary.
