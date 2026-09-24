---
id: asset-budget-guard
date: 2026-08-28
title: "Keep heavy media out of the repository"
summary: "Tracked files over 1 MB fail CI unless allowlisted, and heavy media lives in the S3 bucket."
domains: [data]
rules: [data.asset-budget]
status: accepted
sources:
  - commit: 'cc4c8ae9b1fb2b27291c26227de8889d4c9fb6f5'
---

## Context

Audio, video, and download media in `public/` were bloating the repository and every deploy.

## Decision

Add `scripts/check-asset-budget.ts` and a hygiene workflow on pull requests. Media moves to the Neon S3 public bucket and is resolved through `getAssetUrl`.

## Alternatives

- Git LFS. Rejected to keep one simple storage path.
- No guard, just a convention. Rejected because large files kept slipping in.

## Consequences

- Pull requests with large tracked files fail until the media moves to S3.
- Only brand essentials stay in `public/`.
