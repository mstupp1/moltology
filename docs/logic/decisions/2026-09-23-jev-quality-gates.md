---
id: jev-quality-gates
date: 2026-09-23
title: "Gate forum posts and Oracle prompts with Jev"
summary: "Jev refuses clear abuse above 80% confidence, keeps low-quality posts out of Hot, and routes Oracle questions to the right model."
domains: [forum, oracle]
rules: [forum.jev-shared, forum.quarantine, forum.hot-feed-quality, forum.fail-open, oracle.jailbreak-gate, oracle.intent-context, oracle.model-routing]
status: accepted
sources:
  - pr: 152
---

## Context

Local patterns missed paraphrased spam and jailbreaks, and every Oracle question used the most expensive model and the full scripture prompt.

## Decision

Use Jev through the AI SDK. Forum posts are refused only when Jev is more than 80% sure they are prohibited. Quality under 50 stays out of Hot but is still stored. Oracle prompts are checked for jailbreaks, classified by intent to pick the prompt context, and rated by complexity to pick a fast or deep model. Everything fails open when Jev is down.

## Alternatives

- Block on any doubt. Rejected because false blocks hurt real members.
- Move posts to the suggested board. Rejected so the member's choice stands.

## Consequences

- One Jev call is added before each forum write and each Oracle message.
- Cheaper models answer simple questions.
