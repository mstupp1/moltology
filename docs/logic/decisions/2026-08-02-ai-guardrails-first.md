---
id: ai-guardrails-first
date: 2026-08-02
title: "Guard every AI call with local checks first"
summary: "Oracle input goes through a cheap local rate limit and pattern checks before any model is called."
domains: [oracle]
rules: [oracle.rate-limit, oracle.input-guardrails]
status: accepted
sources:
  - commit: '104b4740f358b30fe42f0758999ceb8069dc1f14'
---

## Context

The first AI service layer let any text reach a billed model. Abuse and prompt injection would have cost money on every attempt.

## Decision

Every Oracle request first passes an in-memory rate limit (30 a minute) and local input checks: length, known injection phrases, and later explicit harm. Only then is a model called.

## Alternatives

- Rely on provider-side moderation only. Rejected because it still bills the call.
- A hosted rate limiter such as Redis. Deferred to keep the stack small.

## Consequences

- Obvious abuse is refused for free.
- The limiter lives in server memory, so it resets on cold starts and is not shared across instances.
