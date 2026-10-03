---
id: oracle-usage-and-moderation
date: 2026-10-02
title: "Cap Oracle usage per member and move moderation to Laya"
summary: "Members get a durable daily Oracle allowance with Premium at 10x. Moderation uses free Laya for short inputs and Jev for long ones. The Standing review upvotes strong posts instead of adding hidden points."
domains: [oracle, forum, premium, standing]
rules: [oracle.request-pipeline, oracle.usage-allowance, oracle.request-caps, oracle.model-routing, oracle.model-fallback, forum.jev-shared, forum.fail-open, premium.no-standing, standing.review, standing.gain-cap, standing.simulated-votes]
status: accepted
sources:
  - pr: 170
---

## Context

The only Oracle limit was 30 messages a minute, held in one server instance's memory. Clients could send unlimited history, including their own system messages, and replies had no output cap. An unused chat endpoint skipped the jailbreak check. Every moderation call asked for zero data retention, which the gateway refuses on the Hobby plan, so moderation had silently failed open since launch.

## Decision

Store one usage row per Oracle call and limit free members to 5 a minute and 30 per rolling 24 hours, with Premium at 10x. Cap history at 20 turns and 16,000 characters and replies at 1,024 tokens. Send guests the canned reply before any model call. Drop the zero data retention flag. Use Laya, which is free, for inputs up to 1,500 characters and Jev for longer ones. Make GLM 5.3 Flash the chat and title default, keep DeepSeek 4.1 Flash for complex questions, and drop GPT-6 Luna. In the Standing review, keep live scores, rescreen only unscored posts, have a simulated member upvote strong posts, and skip weak posts in simulated voting.

## Alternatives

A token budget per member was more precise but harder to explain than a message count. Keeping Jev for everything costs a little more for better jailbreak recall. Re-scoring every post on each review run added calls without new information.

## Consequences

A higher Oracle allowance is the first Premium benefit. Moderation data is not covered by zero data retention while the gateway account is on Hobby. History still comes from the browser.
