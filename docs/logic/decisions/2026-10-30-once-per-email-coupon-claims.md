---
id: once-per-email-coupon-claims
date: 2026-10-30
title: "Reserve once-per-email promotions before checkout"
summary: "A normalized email and promotion are reserved atomically when an order is created, including while payment is pending."
domains: [merch]
rules: [merch.once-per-email-claim]
status: accepted
sources:
  - pr: 340
  - commit: 5085c4e661acc90d0bee28558af2c6654fcac59a
---

## Context

Each checkout creates a separate Stripe customer. A shopper could open multiple unpaid orders with a once-per-email promotion before paying any of them, bypassing a check that counted only paid orders.

## Decision

Reserve the normalized email and promotion in the same serializable database operation that creates the order. Keep the reservation for pending, paid, and refunded orders. Permit retries of the same order. Release a pending claim only after a final payment failure or a matching Stripe-confirmed session expiration.

## Alternatives

Relying on Stripe's per-customer restriction does not enforce an email-wide rule when each order has a separate customer. Releasing on the shopper's cancel redirect is not proof that the Stripe session can no longer complete.

## Consequences

Only one distinct pending or consumed order can hold a once-per-email promotion for an email address. A definitive provider failure or expiration allows a new order to claim it.
