---
id: oracle-max-model-access
date: 2026-10-31
title: "Oracle MAX adds an entitled advanced model"
summary: "Expose the Oracle MAX plan preview and two model choices while retaining staff-only billing and enforcing paid model access on the server."
domains: [oracle, premium]
rules: [oracle.model-routing, oracle.model-fallback, premium.soft-launch, premium.no-standing]
status: accepted
sources:
  - doc: BRAND_BIBLE.md
---

## Context

Premium had a larger Oracle allowance but a single shared chat model. Its sales page and billing operations were hidden behind the staff experiment. Guests need a useful destination from the locked model option without opening subscription operations to a wider audience.

## Decision

Rename the subscription Oracle MAX. Offer Oracle Current (DeepSeek V4.1 Flash) and MAX-only Oracle Abyss (Claude Sonnet 4.6). Both names describe product options; vendor identifiers remain internal. The entitlement returned with the atomic usage reservation controls server routing, including when membership changes after the initial usage read. MAX defaults to Abyss and may select Current. Failures never fall into another model tier.

The /premium marketing preview is public, with real rolling allowances and an early-access notice. Existing price lookup, checkout, portal and no-charge controls retain their staff experiment gate. Guests retain demo replies; free signed-in accounts receive 15 messages per rolling five hours and 100 per rolling seven days. MAX receives 150 and 1,000 respectively.

## Alternatives

Renaming one backend twice would not provide a model upgrade. Trusting the selected client model or an earlier membership snapshot would allow stale entitlement decisions. Opening billing with the marketing page would expand the existing soft launch beyond this rebrand.

## Consequences

Paid chat requests use the more expensive advanced model. Existing history and output caps remain in force. No rank, clearance, stage or forum authority is sold. The external Stripe product display name is not changed by this code PR.
