# Social media archive

Finished posts, ordered carousel slides, reels and shorts are archived in the existing
Google Drive folder `My Drive/Projects/Moltology`. Production runs on the Mac with
Drive for desktop mounted. Set `SOCIAL_ARCHIVE_ROOT` to that existing Moltology folder
to override automatic discovery; never point it at a disposable worktree directory.

The four creator CLIs write `Social Archive/YYYY/MM/<content-id>/`, using the channel's
America/New_York timezone. Each bundle contains ordered final files and `metadata.json`
with file sizes/SHA-256, reviewed copy, available prompts/scripts, publishing settings
and confirmed Zernio media URLs/IDs/status/schedule. IDs derive from media and settings,
so retries use the same bundle. Intermediate renders stay in ignored `tmp/`.

Archiving must succeed before queueing. Publishing uses local archived files directly
with Zernio's hosted uploads; Drive is private storage, not a public media URL. Publishing
failures preserve the bundle. Confirmed results are saved and reused on retry. If saving
the result fails after Zernio creates a post, the error identifies the post to reconcile
before retrying. Git continuity ledgers retain their editorial role and archive paths.
Dry-run/render-only modes do not write to Drive or upload publishing media.

Website/blog images, canonical character references and shared reel templates remain
on Neon S3. Do not remove an entire social prefix: some files still have dependencies.

## Historical migration

```sh
npm run social:archive -- inventory
npm run social:archive -- copy --limit 2
npm run social:archive -- verify --limit 2
npm run social:archive -- copy
npm run social:archive -- verify
```

Inventory defaults to ignored `tmp/social-archive-migration.json`; `--manifest` selects
another manifest. Preserve it until cleanup finishes. Copy is resumable, streams files,
hashes the source and saved copy independently, and preserves collisions. Historical
media retains its source hierarchy under `Social Archive/Migrated/` or `Legacy/`.
Historical record metadata and the migration manifest are also saved in Drive. Missing
historical publication data is not inferred. Ledger S3 fields remain provenance; added
`archivePaths` and `s3ArchiveObjects[].removedAt` describe the migration.

## Verified cleanup

Confirm Drive desktop reports **Up to date** with no pending uploads/errors. Inspect each
proposed deletion's archived file in Drive web, verifying its folder, file ID and displayed
size against the locally verified bytes. Save that evidence in an ignored JSON file:

```json
{
  "syncingComplete": true,
  "checkedAt": "2026-10-13T21:00:00.000Z",
  "files": [
    { "key": "images/social/posts/example.png", "driveFileId": "verified-cloud-id", "bytes": 12345, "cloudSizeLabel": "Size: 12.1 KB" }
  ]
}
```

Use an actual current timestamp. Evidence expires after 24 hours and must follow the
inventory. `bytes` is the verified local byte count; `cloudSizeLabel` is the observed
Drive listing size and is checked with its displayed rounding precision. Populate
cloud IDs and labels only from observed cloud files, not local filesystem presence.

```sh
npm run social:archive -- prune --cloud-evidence tmp/social-cloud-evidence.json
npm run social:archive -- prune --cloud-evidence tmp/social-cloud-evidence.json --apply
```

Prune previews deletions unless `--apply` is present. It freshly checks all paginated
Zernio posts, production database asset references (`PROD_DATABASE_URL` required), current
source/content references, local hashes, and S3 ETag/size/modification time. Deletes are
conditional on the inventoried ETag. Pass `--allow-published-references` only when historical Zernio preview/source URLs may
stop working. This ignores fully published, non-recycling posts; active and partially
published posts remain protected.

`--allow-unmatched` permits verified legacy objects without a ledger match to be
removed after all runtime checks pass. Use only when cleanup of those copies is authorized.

Unknown dependencies, unavailable checks, shared
assets, missing cloud evidence and changed objects are retained. Per-file results are
checkpointed in the manifest. No database schema or content is modified.

Zernio presigned media is temporary for seven days; publication promotes referenced
media to permanent storage. Zernio is the publishing destination, while Drive remains
the durable source archive. Schedule uploaded media within seven days of uploading.
Source: https://docs.zernio.com/guides/media-uploads

If production reads become unavailable after a completed dependency scan, an explicitly
supplied `--database-evidence path` can reuse that scan for up to 24 hours. The JSON must
include `complete: true`, `references`, the actual `checkedAt` timestamp, and
`databaseFingerprint` (SHA-256 of the production connection string). Never manufacture
a successful scan or reset its timestamp. Evidence for another database or an incomplete
scan is rejected; default cleanup still requires a live database check.
