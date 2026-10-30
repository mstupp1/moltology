---
id: atomic-oracle-allowance
date: 2026-10-30
title: "Reserve Oracle allowance atomically"
summary: "Check and reserve Oracle usage in one serializable operation before a model call."
domains: [oracle]
rules: [oracle.request-pipeline, oracle.usage-allowance]
status: accepted
sources:
  - pr: 341
  - commit: 006f7e66a6c3a2013befd80818cc0b0cc3d581e3
---

## Context

Concurrent Oracle requests could each pass the same allowance check and then start separate paid model calls. A failed usage write also allowed a request to continue without a recorded reservation.

## Decision

Check the current rolling limits and insert the usage reservation in a serializable transaction before a model call. Retry serialization conflicts against a fresh transaction timestamp. Fail closed when reservation storage is unavailable, and release the reservation when creating a new conversation fails.

## Alternatives

Keeping capacity checks and usage writes separate leaves a concurrency window. Recording usage after a model call allows a request through when usage persistence fails.

## Consequences

The free and Premium allowance values and usage display remain unchanged. Concurrent requests now compete for the same final slot, and failed new-thread creation does not consume allowance.
