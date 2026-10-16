---
id: security-scan-2026-10
date: 2026-10-16
title: "Close the gaps from the October security scan"
summary: "Google only links to verified accounts, merch waits for payment, blog comments get the forum gates, and public writes require Turnstile."
domains: [auth, signup, forum, premium, oracle]
rules: [auth.google-linking, auth.password-length, signup.turnstile-optional, forum.blog-comments, premium.webhook-signature, oracle.request-pipeline]
status: accepted
sources:
  - doc: docs/logic/domains/auth.md
---

## Context

A security scan of main on 2026-10-16 found no critical issues but several gaps. With email verification off, someone could register another person's address with a password and keep access after the real owner signed in with Google. Merch orders went to Printful on checkout completion even when a delayed payment method had not paid. Blog comments had no rate limit, no moderation, and skipped Turnstile when no token was sent. The Oracle called the model when the usage table could not be read.

## Decision

- Google sign-in links onto an existing account only when that account's email is verified, regardless of the global verification flag. Explicit linking from Settings while signed in still works.
- New passwords need 8 characters. Existing shorter passwords still sign in.
- Merch orders are fulfilled only when Stripe reports the session paid, with async payment success and failure events handled.
- Blog comments require Turnstile and a published post, and share the forum write limit and moderation gate.
- The Oracle refuses with a 503 when member usage cannot be read, and never shows provider error text.
- MoltMax clearance and stage labels are derived from the score on the server.
- Contact form news opt-ins are confirmed by email before the address joins the list.

## Alternatives

- Turning on global email verification would also close the Google gap, but it waits on the mail domain.
- Pinning merch checkout to cards would avoid unpaid completions but drops other payment methods.

## Consequences

An unverified password member who tries Google sign-in sees the existing "account already exists" message and connects Google from Settings instead. Blog comments now cost a moderation call each, inside the forum budget.
