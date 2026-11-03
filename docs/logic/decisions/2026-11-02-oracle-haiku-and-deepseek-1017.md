---
id: oracle-haiku-and-deepseek-1017
date: 2026-11-02
title: "Pin Lite to DeepSeek 1017 and use Haiku for MAX"
summary: "Oracle Lite uses the explicit DeepSeek V4.1 Flash 1017 snapshot; MAX uses Claude Haiku 5.5 with automatic gateway caching."
domains: [oracle, premium]
rules: [oracle.model-routing, oracle.model-fallback, oracle.thread-titles]
status: accepted
sources:
  - doc: src/lib/ai/oracle-models.ts
---

## Decision

Pin Oracle Lite to deepseek/deepseek-v4.1-flash-1017 through DeepInfra. Route Oracle MAX to anthropic/claude-haiku-5.5 through Anthropic, replacing Luna. Preserve no-training filtering, disabled reasoning, and the same selected model for chat and title follow-ups. Enable gateway automatic caching for Anthropic's cache markers. Omit temperature from title requests because Haiku 5.5 does not support sampling controls.

The picker retains its two product labels and admin-only underlying model names, with LobeHub's MIT-licensed DeepSeek and Claude vector logos. Guests retain the selected Lite preview; no guest model calls or allowance changes are introduced.
