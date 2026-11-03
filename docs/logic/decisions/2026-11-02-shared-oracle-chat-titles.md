---
id: shared-oracle-chat-titles
date: 2026-11-02
title: "Use the chat model and first exchange for Oracle titles"
summary: "Lite uses DeepSeek, MAX defaults to GPT-6 Luna, and titles reuse the first chat prefix after the reply."
domains: [oracle, premium]
rules: [oracle.model-routing, oracle.model-fallback, oracle.thread-titles]
status: accepted
sources:
  - doc: src/lib/ai/oracle-models.ts
  - doc: src/lib/ai/handle-oracle-chat-request.ts
---

## Context

Separate title prompts and title-only models cannot reuse the chat request's provider cache. The picker should expose two product choices, with underlying model names visible only to admins.

## Decision

Oracle Lite uses DeepSeek V4.1 Flash through DeepInfra. Oracle MAX defaults to GPT-6 Luna through OpenAI; MAX members may select Lite because both routes disallow prompt training. Guests remain on preset replies, with Lite displayed as selected.

After the first successful reply, request a short title from that same model and pinned provider. Preserve the original system prompt and user message, append the first assistant reply, then append the title instruction. This preserves the prompt prefix for provider cache lookup; actual hits depend on provider eligibility, minimum length, and cache state. No title is generated for a failed or cancelled chat. Keep the excerpt fallback, eight-second timeout, 32-token cap, no retries, request-scoped persistence, and conditional update that protects manual renames.

## Consequences

Title generation remains a separate small inference after the streamed answer. It does not delay the first reply token, but stream completion waits for the bounded title attempt. No title markers appear in the user-facing reply. The title-only Nemo route is removed. This supersedes the model assignments in simplify-oracle-models; usage allowances stay unchanged.
