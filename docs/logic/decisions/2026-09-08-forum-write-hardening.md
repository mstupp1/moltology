---
id: forum-write-hardening
date: 2026-09-08
title: "Harden forum writes with safety checks and a rate limit"
summary: "Forum writes gained harm and secret detection, a 10-per-minute limit, locked-thread enforcement, and staff review."
domains: [forum]
rules: [forum.rate-limit, forum.content-safety, forum.locked-threads, forum.content-limits, forum.covenant-watch]
status: accepted
sources:
  - pr: 90
  - changelog: '2026-09-08-social-activity-stream-community-safety-guardrails'
---

## Context

Member posts skipped harm filters, had no write rate limit, ignored locked threads, and staff could only read flags.

## Decision

Share high-precision secret and harm detectors between the forum and the Oracle. Limit each member to 10 creates or edits per minute. Reject replies on locked threads on the server. Let staff mark flags reviewed without touching the post.

## Alternatives

- A full content classifier. Deferred as too heavy for the need.
- Turnstile on forum composers. Deferred.
- A durable Redis or database rate limit. Deferred.

## Consequences

- Rate limits are per server instance.
- The harm lexicon is deliberately narrow to avoid false positives.
