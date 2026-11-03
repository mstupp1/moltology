---
id: simplify-oracle-models
date: 2026-11-02
title: "Simplify Oracle models to Oracle and Oracle MAX"
summary: "Oracle uses Ling, Oracle MAX uses DeepSeek, and Sonnet is removed from chat routing."
domains: [oracle, premium]
rules: [oracle.model-routing, oracle.model-fallback, premium.no-standing]
status: accepted
sources:
  - doc: src/lib/ai/oracle-models.ts
---

## Context

The model directory mixed product names, provider names, guest previews, and automatic title models. The extra chat choice made Oracle MAX harder to understand.

## Decision

Use Oracle for free Ling chat and Oracle MAX for DeepSeek V4.1 Flash chat through DeepInfra. Remove Sonnet from the configured models. Existing Sonnet selections resolve to the current default for the authoritative membership tier. Keep MAX prompt-training restrictions and separate Nemo title generation.

Remove the directory header and guest preview row. Show the underlying model name beneath each product label instead of provider descriptions. Guest demo replies continue to work.

This replaces the chat naming and Sonnet choice in the October 31 model decisions; their usage, screening, and title-generation rules remain in effect.

## Consequences

MAX has one chat model. Provider failure returns unavailable without switching tiers. Message allowances and membership authority stay unchanged.
