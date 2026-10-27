---
id: event-driven-marketing-consent
date: 2026-10-26
title: "Use event-driven Resend marketing consent"
summary: "Sync explicit subscription events and email opt-outs without a scheduler, import, or new consent table."
domains: [auth, signup]
rules: [auth.marketing-consent, auth.marketing-targets, auth.marketing-unsubscribe]
status: accepted
sources:
  - commit: dfe2470ce31289f78e4ec22f02e8b09cb4153cf4
  - doc: docs/email-marketing.md
---

## Context

Leads and registered members need one marketing preference and separate campaign targets.
Existing lead/profile flags and transactional Resend sending already exist. There are no
real historical subscribers to import.

## Decision

Use explicit application events to manage one Contact per normalized email and three
segments. Confirm public requests, reuse account verification for checked signup consent,
and allow verified members to subscribe directly. Receive signed unsubscribe webhooks and
check current provider state before applying delayed deliveries. Store pending request
identity in existing timestamps; do not add a schema migration or background worker.

## Alternatives

A durable outbox with scheduled reconciliation was rejected as disproportionate to this
initial setup. Separate category preferences and Topics are deferred. Unchecked public
forms do not revoke earlier consent, and registration never manufactures consent.

## Consequences

Provider errors are visible and the user can retry; optional marketing failures do not
block signup, guide download, or contact-message delivery. Provider webhook retries cover
failed inbound opt-outs. A partial provider/local write can still need a repeated action.
The existing API key needs Full access for Contacts and Segments; changing permissions in
the dashboard avoids adding a second API key. Deployment requires the prepared segment
IDs and signing secret, followed by enabling the webhook after the endpoint is live.
