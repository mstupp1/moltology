---
id: google-one-tap
date: 2026-11-11
title: "Offer Google One Tap sign-in on public pages"
summary: "Signed-out visitors on public pages get a Google One Tap card that runs the normal Google sign-in path, screening included."
domains: [auth, signup]
rules: [auth.better-auth, auth.google-linking]
status: accepted
sources:
  - pr: 441
---

## Context

Signing up took several steps. Google One Tap lets a visitor who is signed in to Google create an account or sign in with one tap.

## Decision

One Tap shows once per visit on public pages, never on sign-in, checkout, or app pages. The server verifies Google's token, then runs Better Auth's normal Google sign-in, so signup screening, the email verification linking rule, and new-account hooks all apply. Signing out turns off automatic sign-in, so a member who signed out is asked instead of being signed straight back in.

## Alternatives

- A separate One Tap account path. Rejected because it would skip signup screening.

## Consequences

One Tap only runs on the production origins and localhost, which are registered on the Google client. Preview deployments skip it.
