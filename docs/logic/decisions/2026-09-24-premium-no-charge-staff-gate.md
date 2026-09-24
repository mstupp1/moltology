---
id: premium-no-charge-staff-gate
date: 2026-09-24
title: "Staff-gate the no-charge Premium toggle"
summary: "Activate and cancel without a charge now require the same staff clearance as checkout."
domains: [premium, access]
rules: [premium.no-charge-toggle, premium.soft-launch]
status: accepted
---

## Context

The no-charge activate and cancel path only checked that the caller was signed in. Any member could set Premium on their own profile. Checkout, price lookup, and the billing portal already required staff clearance during the soft launch.

## Decision

Run the no-charge toggle through the same staff check as the other Premium handlers. A non-staff caller gets the plain message "This page is not available." Settings hides Purchase Premium and Cancel Premium from members so they do not see a control that would fail.

## Alternatives

- Leave the toggle open until benefits exist. Rejected because a member could already mark themselves Premium before benefits ship.
- Remove the no-charge path. Rejected because staff still need a way to turn Premium on and off without Stripe during the soft launch.

## Consequences

- Members cannot grant themselves Premium.
- Staff can still activate or cancel their own membership without a charge, and a cancel still ends a Stripe subscription when one is on file.
