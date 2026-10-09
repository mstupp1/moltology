# Homepage reading cards, October 9, 2026

Three images created with built-in ImageGen for Shell Hardness, Pincer Torque and Submergence Depth. Exact prompts and source archive paths are in `generation.json`. Full-size source copies are preserved locally in `scratch/home-readings/2026-10-09/`.

The six delivery WebPs are archived here: 1200 × 900 desktop (quality 82) and 640 × 480 mobile (quality 78). Both sizes preserve the full 4:3 composition. Public delivery uses `images/home/2026-10-09/<filename>` in `moltology-public-assets`, resolved through `getAssetUrl` in `src/components/home/content.ts`. Images load lazily.

To upload again, run the repo CLI for each file:

```sh
npm run s3:upload -- assets/home/2026-10-09/<filename> --key images/home/2026-10-09/<filename>
```

The previous unversioned `home_reading_shell`, `home_reading_grip` and `home_reading_depth` keys remain available for rollback, including their `_sm` variants.
