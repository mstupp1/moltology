# Homepage backgrounds, October 8, 2026

Six new backgrounds, each with desktop and mobile WebP delivery. Full-size originals are archived locally in `scratch/home-backgrounds/2026-10-08/`; generated source files remain in Codex's image archive. The exact prompts and previous S3 keys are recorded in `generation.json`.

The active v3 hero depicts an abstract armored core shedding translucent outer membranes in quiet water. It retains the approved softened detail, muted color, layered edge vignettes, teal haze and strong fades into the page. Both the v1 abstract shell and v2 literal crab-molt experiment remain archived. Surface, seabed and community backgrounds carry the page deeper. Practice depicts a small first shed; the final invitation uses a full-card shell scene.

Desktop files are 1672 × 941. Mobile files are 768 × 1365. Hero, practice and first-shed mobile versions have dedicated portrait artwork. The other three mobile versions use center crops of compositions designed to keep detail at the edges. Desktop WebP quality is 80; mobile quality is 76.

Delivery keys are `images/home/2026-10-08/<filename>` in `moltology-public-assets`. Resolve them through `getAssetUrl`; files here are the archived delivery assets, not public-folder assets. The hero's responsive preload matches its picture sources; every below-fold background is lazy loaded.

To upload an asset again, use the repository CLI:

```sh
npm run s3:upload -- assets/home/2026-10-08/<filename> --key images/home/2026-10-08/<filename>
```

All prior assets remain at their existing keys. To roll back, restore the prior hero and background references recorded in `generation.json`; no asset deletion is required.
