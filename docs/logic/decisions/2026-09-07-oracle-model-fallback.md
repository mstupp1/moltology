---
id: oracle-model-fallback
date: 2026-09-07
title: "Fall back through Oracle models on empty streams"
summary: "The Oracle waits for a first token before committing to a model, and tries the next model on failure."
domains: [oracle]
rules: [oracle.model-fallback]
status: accepted
sources:
  - pr: 92
---

## Context

The Oracle committed to the first model as soon as the stream opened. An empty or hung stream returned "No response received" even though other models worked.

## Decision

Treat `ORACLE_MODELS` as an ordered fallback chain. Try the preferred or selected model, wait up to 12 seconds for the first real token, and move on after an empty stream, error, or timeout. Show the unavailable message only when every model fails.

## Alternatives

- Retry the same model. Rejected because provider outages are usually model-specific.

## Consequences

- Worst-case latency grows with each failed model.
- A member-selected model is tried first but is not exclusive.
