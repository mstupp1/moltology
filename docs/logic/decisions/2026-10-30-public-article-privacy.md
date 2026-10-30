---
id: public-article-privacy
date: 2026-10-30
title: "Keep unpublished articles private"
summary: "Public article and Markdown lookups return content only for explicitly published database or static articles."
domains: [data]
rules: [data.public-article-privacy]
status: accepted
sources:
  - pr: 339
  - commit: ac9ec2bf6b6c8c35e137e2c67f1bd63bd32c29f4
---

## Context

Public slug lookups could return unpublished database posts, and both public route fallbacks could return unpublished static posts. The Markdown endpoint exposed the same article body as the page.

## Decision

Require explicit publication for database lookups and every static fallback. Preserve published article behavior and return no article for unpublished or unknown slugs.

## Alternatives

Allowing public slug lookup to act as a draft preview would keep private content reachable without a staff gate. Draft previews need a separate authenticated path.

## Consequences

Article pages and Markdown responses share the same publication boundary. Static seeds are public only when their publication flag is true.
