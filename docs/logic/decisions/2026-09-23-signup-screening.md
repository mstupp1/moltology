---
id: signup-screening
date: 2026-09-23
title: "Screen new signups for bots and burners"
summary: "Signups pass a honeypot, a timing signal, disposable-domain checks, and a Jev decision, and fail open on errors."
domains: [signup]
rules: [signup.pipeline, signup.honeypot, signup.fast-form, signup.disposable-domains, signup.google-fast-path, signup.jev-budget, signup.fail-open, signup.block-thresholds, signup.challenge, signup.risk-events]
status: accepted
sources:
  - pr: 156
---

## Context

Bots and disposable inboxes could create accounts freely, and global email verification was still off.

## Decision

Reject filled honeypots with a 400 before any model call. Challenge disposable domains with inbox confirmation. Let common-provider Google accounts with a real name skip the model. Otherwise ask Jev within 800 ms: block email above 0.8 and Google above 0.9, and challenge risky signups. Log outcomes privately in `signup_risk_events`. Allow the signup if anything fails.

## Alternatives

- CAPTCHA on every signup. Rejected as friction for real people.
- Turn on global verification. Deferred until delivery is proven.

## Consequences

- A few bots will get through when Jev is down, by design.
- Challenged members must confirm their inbox before signing in.
