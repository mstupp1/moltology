---
id: forum-short-post-limits
date: 2026-11-02
title: "Keep forum submissions within the short-input screening budget"
summary: "Limit bodies to 1,350 characters and titles to 150 so new forum submissions fit Laya without chunking."
domains: [forum]
rules: [forum.content-limits, forum.jev-shared]
status: accepted
sources:
  - doc: src/lib/community-rules.ts
---

## Context

Forum bodies previously allowed 10,000 characters. Screening routes inputs above 1,500 characters to Jev. Splitting long submissions would complicate whole-post quality scoring.

## Decision

Keep the 150-character title maximum and reduce topic and reply bodies to 1,350 trimmed Markdown characters, including formatting and links. Preserve the 10-visible-character body minimum. Show the serialized character count in every body editor and prevent oversized drafts from being submitted. Apply validation on create and edit without truncating saved posts or drafts.

## Alternatives

Keep long posts with Jev, or split posts into overlapping Laya chunks. Concise conversation is preferred over either approach.

## Consequences

New topics fit the 1,500-character screening budget. Existing long posts remain readable but must be shortened when edited. The long-input screening route remains available for legacy content and other callers. A reply to a legacy title over 150 characters may still use that route.
