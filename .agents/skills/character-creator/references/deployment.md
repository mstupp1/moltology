# Mascot adoption and deployment

Read this for requested additions, replacements, refreshes or retirement. A design test alone does not include deployment; use authorization already present in the conversation.

## Files and upload

Keep master `char_<name>.png` and alpha-preserving `char_<name>.webp`. Native-transparent renders need format conversion, not chroma keying. WebP quality 90 matches the chroma script's default starting quality; inspect fine edges after conversion. Do not promise fixed file sizes or bandwidth savings.

Copy selected files to `scratch/characters/` and `scratch/character_refs/`. Retain experimental sources and old versions before overwriting references.

Upload through the repo CLI with the actual selected filename. Upload the PNG first: it writes an automatic `.webp` twin at quality 78, which the second command replaces with the hand-checked quality-90 WebP.

```bash
npx tsx scripts/upload-asset.ts scratch/characters/char_name.png --key images/characters/char_name.png
npx tsx scripts/upload-asset.ts scratch/characters/char_name.webp --key images/characters/char_name.webp
```

Resolve public URLs through `src/lib/assets.ts`; do not hardcode the bucket hostname in consumers. Verify both objects are accessible with expected format and dimensions before changing consumers.

## Add

Register the species-prefixed named key and versioned WebP filename in `MASCOT_CAST` in `src/lib/mascots.ts`. Both component/script registries and the studio selector derive from this source. Keep the chosen reference and identity record available for subsequent poses. Update the video director's story role for the new individual; visual descriptions derive from the same cast metadata.

## Rename or replace

Upload new keys first. Retain old objects for historical links. Map legacy keys to successors in `RETIRED_MASCOT_SUCCESSORS` in `src/lib/mascots.ts`; `resolveMascotAlias()` handles both consumers. Preserve exact retired filenames as aliases, including junior file stems. Normalize saved initial selections and template resets to active keys so the dropdown and rendered art agree.

Upload to both new and legacy keys only when refreshing historical asset URLs is included in the request. Otherwise preserve historical art. Back up existing files before an authorized overwrite.

Update affected cache-version query parameters in both component and script registries. Preserving character keys does not eliminate the need to invalidate caches.

## Refresh in place

For requested replacement under an existing key, retain backups, update PNG and WebP in S3 and local references, and bump affected registry cache versions.

## Retire

Keep S3 objects for historical content. Remove the active dropdown option; redirect aliases to a designated successor when appropriate to the request. Update registry-key tests when active keys change.

## Compositing and verification

Use `overlayCharacterOnImage` from `scripts/lib/character-overlay.ts`:

```typescript
await overlayCharacterOnImage(baseImagePath, outputImagePath, {
  character: 'lobster_rook_tide',
  position: 'bottom-right',
  scalePercent: 30,
})
```

It resolves local references or S3; check local reference freshness when old art appears. Run scoped character/composite tests and typecheck as listed in the main skill after adoption or registry changes.

`MascotOverlay` falls back to `DEFAULT_MASCOT_KEY` on an image error. Seeing the default does not verify the selected asset. Check the selected object's exact URL; upload a missing WebP instead of changing the default. When retrieval succeeds but art is wrong, check filenames, aliases, local references and cache versions.
