# Content cast

Moltology's content uses eight 3D characters built in the site's character creator. They are defined in [cast.json](cast.json): look (a character-creator config), signature pose, role, story role, a written description and a fixed Fish voice. Reels, posts, carousels, Swipe Lab, blog art, animated lessons and the composite studio all use this one list.

| Character | Key | Role | Voice |
| --- | --- | --- | --- |
| Juno Marsh | `crab_juno_marsh` (`juno`, was `host-crab`) | Host. Explains lessons straight to camera, warm and quick. Default character. | BOOK RECORD REGULAR |
| Kit Shallows | `lobster_kit_shallows` (`kit`, was `junior-lobster`) | Newcomer. Asks the first-timer questions, shy and curious. | Friendly Young Female |
| Otto Basalt | `crab_otto_basalt` (`otto`) | Veteran coach. Big, steady, says little and means it. | Ethan |
| Sol Ember | `lobster_sol_ember` (`sol`) | The striver. Chasing the next molt, proud, a little too intense. | Young Creative Voice |
| Nell Quill | `lobster_nell_quill` (`nell`) | The researcher. Reads the Codex footnotes, dry and precise. | Laura |
| Bo Pebble | `crab_bo_pebble` (`bo`) | Comic relief. Means well, trips over the obvious lesson first. | Just Many |
| Vera Drift | `lobster_vera_drift` (`vera`) | The skeptic. Pushes back so the lesson has to earn it. | Friendly Young Woman |
| Moss Tern | `crab_moss_tern` (`moss`) | The calm elder. Slow, kind, has molted many times. | Mommy |
| Maris Slate | `crab_maris_slate` (`maris`) | The strategist. Maps out the hard problem and tests the rule before acting. | Hannah |
| Cora Pearl | `lobster_cora_pearl` (`cora`) | The curator. Notices taste, pacing, and small details everyone else rushes past. | Twilight Sparkle |

Voices are first picks from the Fish catalog in `scripts/lib/tts-providers/fish-audio.ts`; change one in `cast.json` after hearing it. Keep each character's voice fixed once it has been used in published content.

## Rendering stills

`npm run cast:render` draws stills with the same 3D code as the site (fast on a Mac GPU, about 15 to 20 seconds per still on a cloud machine). Results go to `tmp/cast/<key>/` and are reused until the look or options change.

```bash
npm run cast:render                                       # every character's signature full-figure still
npm run cast:render -- --who juno --pose point --mood happy
npm run cast:render -- --who kit --shot portrait           # head and shoulders
npm run cast:render -- --who otto --shot sheet             # reference sheet for image models
npm run cast:render -- --who sol --pose victory --over plate.png --to scene-4.png --at right
npm run cast:render -- --shot full --all-poses --publish   # upload every pose for the composite studio
```

`--publish` uploads full stills as WebP to `images/characters/char_<name>_3d_<pose>_<hash>.webp`. The hash comes from the look, so a changed look publishes new files and old posts keep their pictures. Run it on Myles's Mac (the cloud environment has no bucket write access) whenever the cast changes. Until a pose is published, script renders draw it on demand, and the browser composite studio falls back to the character's signature pose.

## Changing the cast

- To add a character, design it in the character creator (or write the config by hand), add an entry to `cast.json` with a key of the form `lobster_<first>_<last>` or `crab_<first>_<last>`, render a full still and a sheet, and check them. See the character-creator skill.
- Don't restyle a character that has appeared in published content. A new look is a new character.
- Retired 2D characters (Rook Tide, Pip Current, Mira Kelp, Cal Brack, Tess Shoal, Faye Ripple and older role keys) resolve to 3D successors in `src/lib/mascots.ts`, so old drafts and history still load. Their briefs are kept in [retired-2d/](retired-2d/).
