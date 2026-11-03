---
id: oracle-local-screening
date: 2026-11-02
title: "Remove remote Oracle screening and retain message limits"
summary: "Chat uses local guardrails without a Laya or Jev preflight; free messages retain the 1,500-character limit and MAX retains 4,000."
domains: [oracle, signup]
rules: [oracle.request-pipeline, oracle.input-guardrails, oracle.jailbreak-gate, oracle.intent-context, oracle.model-routing, signup.jev-budget, signup.fail-open]
status: accepted
sources:
  - doc: src/lib/ai/handle-oracle-chat-request.ts
---

## Context

Remote Oracle screening checked for jailbreak attempts in addition to the existing local patterns. It introduced an evaluation request with a 1,200 ms timeout and allowed requests through when evaluation failed. The system prompt already uses a shared static prefix and local scripture lookup; it does not need the evaluator's intent or complexity classification.

## Decision

Remove the remote screening call and its unused Oracle preflight module. Keep local input safety checks, JWT verification, authoritative membership and model access checks, usage reservations, and stored conversation history. Free members and guests retain a 1,500-character per-message limit; MAX retains 4,000. Forum retains shared Laya/Jev routing. Signup screening uses Laya explicitly, with bounded fields and no Jev fallback; existing signup decisions and the 800 ms fail-open budget remain.

This replaces the Oracle screening and intent-routing portions of the earlier Jev quality gates and Oracle usage/moderation decisions. Their forum and usage rules remain in effect.

## Alternatives

Keep remote screening as an additional layer. Rejected because its narrow chat role does not justify another request in every member message. Removing all local checks or changing forum screening is outside this decision.

## Consequences

Chat no longer waits for remote screening or sends a separate prompt copy to a moderation endpoint. Paraphrased jailbreak detection from that evaluator is removed; local input checks and the chat model's own behavior remain. Existing message limits continue to distinguish free and MAX access.
